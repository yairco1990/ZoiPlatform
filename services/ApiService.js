const UserApiLogic = require('../logic/ApiLogic/UserApiLogic');
const AcuityLogic = require('../logic/AcuityLogic/AcuityLogic');
const GmailLogic = require('../logic/GmailLogic');
const zoiConfig = require('../config');
const MyLog = require('../interfaces/MyLog');
const router = require('express').Router();

const PREFIX_LOG = "Api Request -> ";

//create user
router.post('/createUser', async function (req, res) {
	MyLog.log(PREFIX_LOG + "createUser. facebookId = " + req.body.userID);
	let userApiLogic = new UserApiLogic();
	const {status, data} = await userApiLogic.createUser(req.body);
	res.status(status).send(data);
});

//get user
router.get('/getUser', async function (req, res) {
	MyLog.log(PREFIX_LOG + "getUser. userId = " + req.query.userId);
	let userApiLogic = new UserApiLogic();
	const {status, data} = await userApiLogic.getUserById(req.query.userId);
	res.status(status).send(data);
});

//save user
router.post('/saveUser', async function (req, res) {
	let userApiLogic = new UserApiLogic();
	let user = JSON.parse(req.query.user);
	MyLog.log(PREFIX_LOG + "saveUser. userId = " + user._id);
	const {status, data} = await userApiLogic.saveUser(user);
	res.status(status).send(data);
});

//unsubscribe from zoi
router.get('/unsubscribe', function (req, res) {
	MyLog.log(PREFIX_LOG + "unsubscribe. email = " + req.query.email);
	let acuityLogic = new AcuityLogic();
	acuityLogic.unsubscribe(req.query, function (status, data) {
		res.status(status).send(data);
	});
});

//end point for Zoi admins to remind the user to integrate with Acuity
router.post('/integrateReminder', function (req, res) {
	MyLog.log(`${PREFIX_LOG} Integrate reminder executed. time = ${req.body.days} days`);
	let acuityLogic = new AcuityLogic();
	acuityLogic.sendIntegrationReminder(req.body, bot, (status, data) => {
		res.status(status).send(data);
	});
});

router.get('/test', function (req, res) {
	res.status(200).send("Test Success");
});

module.exports = router;