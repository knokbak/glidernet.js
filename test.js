const { Socket } = require('./dist/index.js');
const chalk = require('chalk');

(async () => {

    console.clear();

    const host = await Socket.getHost();
    console.log('host:', host);

    const socket = new Socket({
        host: host,
        port: 14580,
        auth: {
            callsign: 'GNETJS',
            receiveOnly: true,
        },
        filter: {
            longitude: -3.32193147,
            latitude: 56.18910734,
            distance: 10,
        },
    });

    const aircraft = new Map();
    setInterval(() => {
        console.clear();
            console.log(`X    SOURCE          LATITUDE    LONGITUDE    TRACK    SPEED    ALTITUDE    LEVEL`);
            console.log(`---------------------------------------------------------------------------------`);
        for (const [source, position] of aircraft.entries()) {
            const seenSecondsAgo = Math.floor((new Date() - position.seenAt) / 1_000);
            if (seenSecondsAgo > 90) {
                aircraft.delete(source);
                continue;
            }

            const secs = addPadding(seenSecondsAgo.toString(), 2, ' ', false);
            const str = `${seenSecondsAgo > 60 ? chalk.redBright(secs) : secs}   ${source}       ${position.body.latitude.toFixed(3)}      ${position.body.longitude.toFixed(3)}        ${addPadding(position.body.groundTrack.toString(), 3, '0')}      ${addPadding(position.body.groundSpeed.toString(), 5, ' ', false)}    ${addPadding(`${position.body.altitude.toLocaleString()}ft`, 8, ' ', false)}    FL${addPadding(position.body.flightLevel.toString(), 3, '0')}`;
            console.log(position.body.groundSpeed > 10 ? chalk.whiteBright(str) : chalk.gray(str));
        }
    }, 500);

    function addPadding(str, minLength, pad, padLeft = true) {
        while (str.length < minLength) {
            str = padLeft ? pad + str : str + pad;
        }
        return str;
    }

    socket.on('position', (position) => {
        position.seenAt = new Date();
        aircraft.set(position.header.source, position);
    });

    socket.connect();

})();
