'use strict';
const https = require('https');
const fs = require('fs');
const ListenLogic = require('../logic/ListenLogic');
const Bot = require('./bot_framework');
const repHandler = require('./replyHandler');
const Util = require('util');
const MyUtils = require('../interfaces/utils');
const PostbackLogic = require('../logic/PostbackLogic');

// Webhook port (facebook will access to https://myserver.com:4488)
// Facebook doesn't work with http, only https allowed
const PORT = 3000;

//TODO here we decide if mock or real world
const logicType = MyUtils.logicType.MOCK;

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
    //console.log(payload);

    // get message text
    // if message has no text (e.g. location response) - stringify it.
    // let text = !!payload.message.text ? payload.message.text : JSON.stringify(payload.message);
    // let msg_payload = !!payload.message.quick_reply && !!payload.message.quick_reply.payload ? payload.message.quick_reply.payload : null;

    // get profile info
    bot.getProfile(payload.sender.id, (err, profile) => {
        if (err) throw err;//

        // user information
        let display_name = profile.first_name + ' ' + profile.last_name;
        let sender_id = payload.sender.id;

        // build reply
        // let rep = repHandler.buildReply(payload);

        //MY RESPONSE LOGIC
        let listenLogic = new ListenLogic();

        //check if real world or mock to decide which process function we should use
        let processType = logicType === MyUtils.logicType.REAL_WORLD ? "processInput" : "processMock";

        //process the input and return an answer to the sender
        listenLogic[processType](payload.message.text, function (status, rep) {
	  // send reply
	  reply(rep, (err) => {
	      if (err) throw err;
	      console.log(`Echoed back to ${display_name} [id: ${sender_id}]`);
	  });
        });
    });
});

//postback buttons handler
bot.on('postback', (payload, reply) => {

    // get profile info
    bot.getProfile(payload.sender.id, (err, profile) => {
        if (err) throw err;

        // user information
        let display_name = profile.first_name + ' ' + profile.last_name;
        let sender_id = payload.sender.id;
        let postbackLogic = new PostbackLogic();

        //check if real world or mock to decide which process function we should use
        let processActionType = logicType === MyUtils.logicType.REAL_WORLD ? "processAction" : "processMockAction";

        postbackLogic[processActionType](JSON.parse(payload.postback.payload), function (status, rep) {
	  // send reply
	  reply(rep, (err) => {
	      if (err) throw err;
	      console.log(`Echoed back to ${display_name} [id: ${sender_id}]`);
	  });
        });
    });
});

// create and start webhook server
let server = https.createServer({
    ca: fs.readFileSync('../bundle.crt'),
    pfx: fs.readFileSync('../zoiaicom.pfx'),
    passphrase: 'ig180688'
}, bot.middleware());
server.listen(PORT);
console.log('Echo bot server running at port ' + PORT + '.');


if (logicType === MyUtils.logicType.REAL_WORLD) {
    //TODO this is arab
    const BookerplusLogic = require('../logic/BookerplusLogic');
    //MY RESPONSE LOGIC
    let bookerplusLogic = new BookerplusLogic('eyJjdHkiOiJ0ZXh0XC9wbGFpbiIsImFsZyI6IkhTMjU2In0.eyJzZXNzaW9uVG9rZW4iOiI1OGZjMGNkOS01MjJlLTQzZmMtODI4Yi01YmFhZTEzZmY2ZGEiLCJpZCI6MTgzNCwidHlwZSI6MX0.cxiL0yX4knjiRJlUGutB0CIsQaRsddyLreHURZVFH4o');
    bookerplusLogic.getServices({}, function () {
        Util.log("got services");
    });
}