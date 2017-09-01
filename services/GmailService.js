const UserApiLogic = require('../logic/ApiLogic/UserApiLogic');
const AcuityLogic = require('../logic/AcuityLogic/AcuityLogic');
const GmailLogic = require('../logic/GmailLogic');
const Acuity = require('acuityscheduling');
const zoiConfig = require('../config');
const MyLog = require('../interfaces/MyLog');
const router = require('express').Router();

const PREFIX_LOG = "Gmail Request -> ";

//integrate with gmail
router.get('/auth', function (req, res) {
	MyLog.log(PREFIX_LOG + "integrateWithGmail. userId = " + req.query.userId);
	GmailLogic.integrate(req.query.userId, function (status, data) {
		res.writeHead(status, data);
		res.send();
	});
});

//get here after the user accept permissions
router.get('/oauthcallback', function (req, res) {
	MyLog.log(PREFIX_LOG + "oAuthGmail. userId = " + req.query.state);
	GmailLogic.getTokens(req.query.state, req.query.code, function (status, data) {
		res.writeHead(status, data);
		res.send();
	});
});

module.exports = router;