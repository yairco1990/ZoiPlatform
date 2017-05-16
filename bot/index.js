'use strict';
//const http = require('http');
const https = require('https');
const fs = require('fs');

const PORT = 4488;
const Bot = require('./bot_framework');

let bot = new Bot({
    // page token
    token: 'EAATS43ZAMkJQBABZAgDpO6nzFWp3cnWDXWJtZCVNB7l84HsZCniFrJyLHyIauDZBkZA5O4YWQsZC6UZCoS3e2Amwi45G5LklNm3NqgwAMImf7ZAPgAWrlwA5LjyMlockyuJgipU1hvZAsIqEFu33vZAZBZBHUmElYw4c7BztZAX5WrwifhMQZDZD',

    // verify token
    verify: 'testtoken',

    // app secret
    app_secret: '1b27655a518d7d7ee75312074afabe09'
});

bot.on('error', (err) => {
    console.log(err.message)
});

bot.on('message', (payload, reply) => {
    let text = payload.message.text;

    bot.getProfile(payload.sender.id, (err, profile) => {
        if (err) throw err;

        reply({text}, (err) => {
            if (err) throw err;
            console.log(`Echoed back to ${profile.first_name} ${profile.last_name}: ${text}`);
        });
    });
});

//var server = http.createServer(bot.middleware());
var server = https.createServer({
    pfx: fs.readFileSync('C:\zoiSiteServer.pfx'),
    passphrase: 'ig180688'
}, bot.middleware());
server.listen(PORT);
console.log('Echo bot server running at port ' + PORT + '.');