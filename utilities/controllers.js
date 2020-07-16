const fs = require('fs');
//Parse the TXT file
function parseLog(log) {
    return new Promise((resolve, reject) => {

        let initGames = []
        let lines = log.split(/[\n]/);

        lines.map((line) => {

            let arrayLine = line.trim().split(/[\\]/);
            let lineType = arrayLine[0].split(' ');

            switch (lineType[1]) {
                case 'InitGame:':
                    newGame(initGames);
                    break;
                case 'ClientUserinfoChanged:':
                    newPlayer(initGames, line);
                    break;
                case 'Kill:':
                    countKills(initGames, arrayLine);
            }

        });

        resolve(initGames);

    })
}
//Reads the File
function readLog(file) {
    let promise = new Promise((resolve, reject) => {
        try {
            fs.readFile(file, 'utf8', function (err, log) {
                if (err) {
                    return console.log(err);
                }
                resolve(log.toString())
            });
        } catch (error) {
            reject({ message: error });
        }
    })
    return promise;
}
//Generates a New Game
function newGame(initGames) {
    initGames.push(
        {
            "game": null,
            "status": {
                "total_kills": 0,
                "players": []
            }
        }
    );

    initGames[initGames.length - 1].game = initGames.length - 1
}
//Generate a New Player or check if a existing player has changed his name
function newPlayer(initGames, line) {
    let startIndex = line.indexOf('n\\');
    let endIndex = line.indexOf('\\t') - 1;
    let charNumber = endIndex - startIndex;
    let lineArray = line.trim().split(' ')
    let player_id = lineArray[2]
    let player_name = line.trim().substr(startIndex, charNumber);
    player_name = player_name.replace(/\\/g, '');
    let players = initGames[initGames.length - 1].status.players
    if (players.length == 0) {
        player_object = { "id": player_id, "nome": player_name, "kills": 0, "old_names": [] }
        players.push(player_object);
    } else {
        var exists = players.filter((el) => {
            return el.nome == player_name
        })
        if (exists.length === 0) {
            index = players.findIndex((obj => obj.id == player_id));
            if (index != -1) {
                players[index].old_names = players[index].nome;
                players[index].nome = player_name
            } else {
                player_object = { "id": player_id, "nome": player_name, "kills": 0, "old_names": [] }
                players.push(player_object);
            }
        }
    }

}

function countKills(initGames, arrayLine) {
    initGames[initGames.length - 1].game.total_kills++;
    let user = arrayLine[0].includes('<world>');
    if (user) {
        countWorldKill(initGames, arrayLine);
        return;
    }
    countUserKill(initGames, arrayLine);

    function countWorldKill(initGames, arrayLine) {
        let killed = recoverPlayer(arrayLine, 'world');
        let players = initGames[initGames.length - 1].status.players
        index = players.findIndex((obj => obj.nome == killed.player))
        players[index].kills -= 1;
        initGames[initGames.length - 1].status.total_kills += 1;
        return;
    }

    function countUserKill(initGames, arrayLine) {
        let killer = recoverPlayer(arrayLine, 'player');
        let players = initGames[initGames.length - 1].status.players
        if (killer.validKill) {
            index = players.findIndex((obj => obj.nome == killer.player))
            players[index].kills += 1;
            index = players.findIndex((obj => obj.nome == killer.killed))
            players[index].kills -= 1;
            initGames[initGames.length - 1].status.total_kills += 1;
        }
        else {
            index = players.findIndex((obj => obj.nome == killer.player))
            players[index].kills -= 1;
            initGames[initGames.length - 1].status.total_kills += 1;
        }
        return;
    }
}

//Recover Players on the Action
function recoverPlayer(logLine, deadBy) {
    let action = { player: undefined, validKill: undefined };
    if (deadBy === 'world') {
        let player = logLine[0].substr(logLine[0].indexOf('killed'));
        player = player.substr(7, player.indexOf('by'));
        player = player.split('by');
        action.player = player[0].trim();
        action.validKill = true;
    }
    else {
        let player = logLine[0].substr(logLine[0].lastIndexOf(':')).substr(2);
        player = player.slice(0, player.indexOf('killed')).trim();
        let killed = logLine[0].substr(logLine[0].lastIndexOf('killed')).substr(7);
        killed = killed.slice(0, killed.indexOf('by')).trim();
        action.player = player;
        action.killed = killed
        if (player !== killed) {
            action.validKill = true;
        }
        else {
            action.validKill = false;
        }
    }
    return action;
}

exports.readLog = readLog
exports.parseLog = parseLog