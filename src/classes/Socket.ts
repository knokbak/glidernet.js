import net from 'node:net';
import dns from 'node:dns';
import { PositionPacket, SocketOptions } from '../util/types';
import { EventEmitter } from 'node:events';

export class Socket extends EventEmitter {
    socket: net.Socket;
    options: SocketOptions;
    lastKeepAlive: number = 0;
    scheduler?: NodeJS.Timeout;

    constructor(options: SocketOptions) {
        super();
        this.socket = new net.Socket();
        this.options = options;
        this.socket.on('connect', this.handleConnect.bind(this));
        this.socket.on('data', this.handleData.bind(this));
        this.socket.on('close', this.handleClose.bind(this));
    }

    private handleConnect() {
        this.lastKeepAlive = Date.now();
        this.send(`user ${this.options.auth.username} pass ${this.options.auth.receiveOnly || !this.options.auth.password ? '-1' : this.options.auth.password} vers glidernet.js 1.0.0 filter r/${this.options.filter.latitude}/${this.options.filter.longitude}/${this.options.filter.distance}\r\n`);
        this.emit('connected');

        if (this.scheduler) {
            clearInterval(this.scheduler);
        }
        this.scheduler = setInterval(() => {
            if (Date.now() - this.lastKeepAlive > 60_000) {
                this.socket.end();
            }
        }, 500);
    }

    private handleData(data: Buffer) {
        const str = data.toString();

        const lines = str.split('\n');
        for (const line of lines) {
            if (line.startsWith('#')) {
                this.lastKeepAlive = Date.now();
                this.emit('keepalive', line);
                return;
            }

            if (line.length === 0) {
                continue;
            }

            try {
                const [header, body] = line.split(':');
                const source = header.split('>')[0];
                const destination = header.split('>')[1].split(',')[0];
    
                const time = new Date();
                time.setUTCHours(parseInt(body.slice(1, 3)));
                time.setUTCMinutes(parseInt(body.slice(3, 5)));
                time.setUTCSeconds(parseInt(body.slice(3, 7)));
    
                const latitudeDeg = parseFloat(body.slice(8, 10));
                const latitudeMin = parseFloat(body.slice(10, 15));
                const longitudeDeg = parseFloat(body.slice(17, 20));
                const longitudeMin = parseFloat(body.slice(20, 25));
                const latitude = latitudeDeg + latitudeMin / 60;
                const longitude = longitudeDeg + longitudeMin / 60;
    
                const track = parseInt(body.slice(27, 30));
                const speed = parseInt(body.slice(31, 34));
                const altitude = parseInt(body.slice(37, 43));
                const verticalSpeed = parseInt(body.split(' ')[3].replace('fpm', ''));
                const flightLevel = parseInt(body.split(' ')[5].replace('FL', ''));
    
                const position: PositionPacket = {
                    header: {
                        source,
                        destination,
                    },
                    body: {
                        time,
                        latitude,
                        longitude,
                        groundTrack: track,
                        groundSpeed: speed,
                        altitude,
                        verticalSpeed,
                        flightLevel,
                    },
                };
                this.emit('position', position);
            } catch {
                this.emit('packet', line);
            }
        }
    }

    private handleClose() {
        this.emit('closed');
    }

    public connect() {
        this.socket.connect(this.options.port, this.options.host);
    }

    public send(data: string) {
        this.socket.write(data);
        this.emit('sent', data);
    }

    public static async getHost(domain: string = 'aprs.glidernet.org'): Promise<string> {
        return new Promise((resolve, reject) => {
            dns.resolve4(domain, (err, addresses) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(addresses[0]);
            });
        });
    }
};
