'use strict';
const https = require('https');
const fs = require('fs');

// Webhook port (facebook will access to https://myserver.com:4488)
// Facebook doesn't work with http, only https allowed
const PORT = 4488;

// bot class
const Bot = require('./bot_framework');
// import reply handler functions
const repHandler = require('./replyHandler');

// initialize bot
let bot = new Bot({
    // page token
    token: 'EAATS43ZAMkJQBAJBYqHuDcbO3YezZAtK0ekf82lZAZB4ll1BshhtzkFZCDJu7N0EAT0ciav3MZC9FTeKD1ebiWvceTbxbuuAMGtcuLUNhA5D1JoZCyBvcK65ZCZBBXuZBZBFKbDHzkckq67YVf8hIbnCyZAZASEcddUMbeZB2ZCikLMmtgJ1AZDZD',

    // verify token
    verify: 'testtoken',

    // app secret
    app_secret: '1b27655a518d7d7ee75312074afabe09'
});

// bot error handler
bot.on('error', (err) => {
    console.log(err.message)
});

// bot message handler
bot.on('message', (payload, reply) => {
    // get message text
    let text = payload.message.text;

    // get profile info
    bot.getProfile(payload.sender.id, (err, profile) => {
        if (err) throw err;

        var rep = handleReply(text);

        reply(rep, (err) => {
            if (err) throw err;
            console.log(`Echoed back to ${profile.first_name} ${profile.last_name}[id: ${payload.sender.id}]: ${text}`);
        });
    });
});


// create and start webhook server
var server = https.createServer({
	ca: fs.readFileSync('bundle.crt'),
    pfx: fs.readFileSync('zoiSiteServer.pfx'),
    passphrase: 'ig180688'
}, bot.middleware());
server.listen(PORT);
console.log('Echo bot server running at port ' + PORT + '.');