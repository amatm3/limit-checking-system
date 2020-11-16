const fs = require('fs');
const readline = require('readline');
const LimitChecking = require('./limit-checking');

const readInterface = readline.createInterface({
    input: fs.createReadStream('./settings.txt')
});
const ordersList = [];

readInterface.on('line', function (line) {
    if (line && line.length > 0) {
        const command = line.split(' ');
        if (command.length === 5) {
            ordersList.push({
                type: command[0],
                user: command[1],
                args: command.slice(2)
            })
        }
    }
});

async function processCommands() {
    const writeStream = fs.createWriteStream('./log.txt');
    for (let i = 0; i < ordersList.length; i++) {
        const command = ordersList[i];
        switch (command.type) {
            case 'LIMIT':
                await LimitChecking.addLimit(command.user, ...command.args.map(Number));
                break;
            case 'REQUEST':
                await LimitChecking.processRequest(command.user, ...command.args.map(Number), function (errMsg) {
                    if (errMsg) {
                        writeStream.write(errMsg + '\n');
                    }
                });
                break;
            default:
                console.log('Unrecognized command');
        }
    }
    writeStream.end();
}

readInterface.on('close', async () => {
    await processCommands();
});
