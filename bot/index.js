'use strict';
//const http = require('http');
const https = require('https');
const fs = require('fs');

const PORT = 4488;
const Bot = require('./bot_framework');

let bot = new Bot({
    // page token
    token: 'EAATS43ZAMkJQBAJBYqHuDcbO3YezZAtK0ekf82lZAZB4ll1BshhtzkFZCDJu7N0EAT0ciav3MZC9FTeKD1ebiWvceTbxbuuAMGtcuLUNhA5D1JoZCyBvcK65ZCZBBXuZBZBFKbDHzkckq67YVf8hIbnCyZAZASEcddUMbeZB2ZCikLMmtgJ1AZDZD',

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

        var rep;

        if (text == "testme"){
            rep = {
                "text":"Pick a color:",
                "quick_replies":[
                    {
                        "content_type":"text",
                        "title":"Red",
                        "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED"
                    },
                    {
                        "content_type":"text",
                        "title":"Green",
                        "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_GREEN"
                    }
                ]
            };
        } else {
            rep = {text};
        }

        //reply({text}, (err) => {
        reply(rep, (err) => {
            if (err) throw err;
            console.log(`Echoed back to ${profile.first_name} ${profile.last_name}[id: ${payload.sender.id}]: ${text}`);
        });
    });
});

//var server = http.createServer(bot.middleware());
var server = https.createServer({
	ca: fs.readFileSync('bundle.crt'),
    pfx: fs.readFileSync('zoiSiteServer.pfx'),
    passphrase: 'ig180688'
}, bot.middleware());
server.listen(PORT);
console.log('Echo bot server running at port ' + PORT + '.');