'use strict';
const fs = require('fs');
const ListenLogic = require('./logic/Listeners/ListenLogic');
const Bot = require('./bot/bot_framework');
const MyLog = require('./interfaces/MyLog');
const MyUtils = require('./interfaces/utils');
const PostbackLogic = require('./logic/Listeners/PostbackLogic');
const express = require('express');
const app = express();
const Services = require('./bot/Services');
const ApiRouting = require('./bot/ApiRouting');
const BackgroundLogic = require('./logic/BackgroundLogic');
const bodyParser = require('body-parser');
const session = require('express-session');
const EmailLib = require('./interfaces/EmailLib');
const ZoiConfig = require('./config');

//load emails and database
EmailLib.loadEmails();
require('./dal/DBManager');

// Webhook port (facebook will access to https://myserver.com:3000)
// Facebook doesn't work with http, only https allowed
let server;

[443, 3000].forEach(function (port) {
	if (process.argv[2] === "local") {
		server = require('http').createServer(app);
	} else {
		const options = {
			ca: fs.readFileSync('../bundle.crt'),
			pfx: fs.readFileSync('../zoiaicom.pfx'),
			passphrase: 'ig180688'
		};
		server = require('https').createServer(options, app);
	}
	server.listen(port);

	MyLog.info('Bot server running at port ' + port + '.');
});
///////////////////////////////////////////////////////////////////////////////////////////////////

// initialize bot
let bot = new Bot(ZoiConfig.BOT_DETAILS);

// Add headers
app.use(function (req, res, next) {
	// Website you wish to allow to connect
	res.setHeader('Access-Control-Allow-Origin', '*');
	// Request methods you wish to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	// Request headers you wish to allow
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', true);
	// Pass to next layer of middleware
	next();
});

app.use('/p', express.static('public'));
//parse body for every request
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
//sign that the server got the request
app.use(function (req, res, next) {
	MyLog.log("-------------------------------------");
	next();
});

//set the routing
Services.setRouting(app, bot);
Services.setBotListeners(bot);
ApiRouting.setApiRouting(app, bot);
BackgroundLogic.startAll(bot);