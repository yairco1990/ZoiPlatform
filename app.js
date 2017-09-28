'use strict';
const zoiBot = require('./bot/ZoiBot');
const fs = require('fs');
const ListenLogic = require('./logic/Listeners/ListenLogic');
const MyLog = require('./interfaces/MyLog');
const cors = require('cors');
const PostbackLogic = require('./logic/Listeners/PostbackLogic');
const express = require('express');
const app = express();
const BackgroundLogic = require('./logic/BackgroundLogic');
const bodyParser = require('body-parser');
const session = require('express-session');
const EmailLib = require('./interfaces/EmailLib');
const BotServices = require('./bot/BotServices');
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
		let options;
		if (!ZoiConfig.isProduction) {
			options = {
				ca: fs.readFileSync('../myCa.ca'),
				pfx: fs.readFileSync('../zoiaicom.pfx'),
				passphrase: 'ig180688'
			};
		} else {
			options = {
				ca: fs.readFileSync('../bundle.crt'),
				pfx: fs.readFileSync('../zoiaicom.pfx'),
				passphrase: 'ig180688'
			};
		}
		server = require('https').createServer(options, app);
	}
	server.listen(port);

	MyLog.info('Bot server running at port ' + port + '.');
});
///////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/mes', function (req, res) {
	res.redirect("https://www.messenger.com/t/zoibot" || '/');
});

// Add headers
app.use(cors());

// Add headers
app.use('/p', function (req, res, next) {
	res.setHeader('X-Frame-Options', 'ALLOW-FROM https://www.messenger.com/');
	res.setHeader('X-Frame-Options', 'ALLOW-FROM https://www.facebook.com/');
	next();
});
//route to the client project
app.use('/p', express.static('public'));

//parse body for every request
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

//sign that the server got the request
app.use(function (req, res, next) {
	MyLog.log("-------------------------------------");
	next();
});

//manage the routing
app.use(require('./services/RoutingManager'));

process.on('unhandledRejection', (reason, p) => {
	MyLog.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

//set facebook bot services
BotServices.setBotRouting(app);

//set facebook bot listeners
BotServices.setBotListeners();

//start background tasks
BackgroundLogic.startAll(zoiBot);