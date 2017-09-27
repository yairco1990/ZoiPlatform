const FacebookLogic = require('../logic/FacebookLogic');
const ZoiConfig = require('../config');
const MyLog = require('../interfaces/MyLog');
const router = require('express').Router();

const PREFIX_LOG = "Facebook Request -> ";

//integrate with facebook
router.post('/auth', async function (req, res) {
	MyLog.log(PREFIX_LOG + "integrateWithFacebook. userId = " + req.query.userId);
	let authResponse = JSON.parse(req.query.authResponse);
	const {status, message} = await FacebookLogic.addFacebookIntegration(req.query.userId, authResponse);

	res.writeHead(status, message);
	res.send();
});

module.exports = router;