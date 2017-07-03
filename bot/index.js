'use strict';
const fs = require('fs');
const ListenLogic = require('../logic/Listeners/ListenLogic');
const Bot = require('./bot_framework');
const Util = require('util');
const MyUtils = require('../interfaces/utils');
const PostbackLogic = require('../logic/Listeners/PostbackLogic');
const speechToText = require('../interfaces/SpeechToText');
const facebookResponses = require('../interfaces/FacebookResponse');
const express = require('express');
const app = express();
const Services = require('./Services');
require('../dal/DBManager');

// Webhook port (facebook will access to https://myserver.com:3000)
// Facebook doesn't work with http, only https allowed
const PORT = 3000;

const options = {
    ca: fs.readFileSync('../bundle.crt'),
    pfx: fs.readFileSync('../zoiaicom.pfx'),
    passphrase: 'ig180688'
};
let server = require('https').createServer(options, app);
server.listen(PORT);
console.log('Echo bot server running at port ' + PORT + '.');
///////////////////////////////////////////////////////////////////////////////////////////////////

// initialize bot
let bot = new Bot({
    // page token
    token: 'EAATS43ZAMkJQBANoXinzXRjPuZC0525CMDtesm8yIdYdBTt9IKftGgyQTfEBlONO04m08CkI4rU2Fv9tPQQmn7wD2m5GMUIUxPKG2u1ZCH3eYJZBFQNH2EeZCL8YSg4RCO5qgIK6roZCfnjaseNCDBBGszIj40AlYjMZCkgxMOzMQZDZD',
    // verify token
    verify: 'testtoken',
    // app secret
    app_secret: '1b27655a518d7d7ee75312074afabe09'
});

//set the routing
Services.setRouting(app, bot);
Services.setBotListeners(bot);