/*
 * Copyright (c) 2023, Ollie Killean
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 * 
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

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
