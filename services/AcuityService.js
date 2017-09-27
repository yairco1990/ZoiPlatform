const UserApiLogic = require('../logic/ApiLogic/UserApiLogic');
const AcuityLogic = require('../logic/AcuityLogic/AcuityLogic');
const GmailLogic = require('../logic/GmailLogic');
const Acuity = require('acuityscheduling');
const zoiConfig = require('../config');
const MyLog = require('../interfaces/MyLog');
const router = require('express').Router();
const zoiBot = require('../bot/ZoiBot');

const PREFIX_LOG = "Acuity Request -> ";

router.get('/authorize', function (req, res) {
	MyLog.log(PREFIX_LOG + "Authorize Acuity. userId = " + req.query.userId);
	let acuity = Acuity.oauth(zoiConfig.ACUITY_OAUTH);
	acuity.authorizeRedirect(res, {scope: 'api-v1', state: req.query.userId});
});

//oauth2 for acuity
router.get('/oauth2', function (req, res) {
	MyLog.log(PREFIX_LOG + "oAuth Acuity. userId = " + req.query.state);
	let acuityLogic = new AcuityLogic();
	acuityLogic.integrate(req.query.state, req.query.code, zoiBot, function (status, data) {
		res.writeHead(status, data);
		res.send();
	});
});

//get clients
router.get('/getClients', function (req, res) {
	MyLog.log(PREFIX_LOG + "getClients. userId = " + req.query.userId);
	let acuityLogic = new AcuityLogic();
	acuityLogic.getClients(req.query.userId, function (status, data) {
		res.status(status).send(data);
	});
});

//getAvailability
router.get('/getAvailability', function (req, res) {
	MyLog.log(PREFIX_LOG + "getAvailability. userId = " + req.query.userId);
	let acuityLogic = new AcuityLogic();
	acuityLogic.getAvailability(req.query, function (status, data) {
		res.status(status).send(data);
	});
});

//get calendars
router.get('/getCalendars', function (req, res) {
	MyLog.log(PREFIX_LOG + "getCalendars. userId = " + req.query.userId);
	let acuityLogic = new AcuityLogic();
	acuityLogic.getCalendars(req.query, function (status, data) {
		res.status(status).send(data);
	});
});

//get appointment types
router.get('/getAppointmentTypes', function (req, res) {
	MyLog.log(PREFIX_LOG + "getAppointments. userId = " + req.query.userId);
	let acuityLogic = new AcuityLogic();
	acuityLogic.getAppointmentTypes(req.query.userId, function (status, data) {
		res.status(status).send(data);
	});
});

//get appointment types
router.get('/sendPromotions', function (req, res) {
	MyLog.log(PREFIX_LOG + "sendPromotions. userId = " + req.query.userId);
	let acuityLogic = new AcuityLogic();
	acuityLogic.sendPromotions(req.query.userId, function (status, data) {
		res.status(status).send(data);
	});
});

//schedule appointment
router.get('/scheduleAppointment', function (req, res) {
	MyLog.log(PREFIX_LOG + "scheduleAppointment. userId = " + req.query.userId);
	let acuityLogic = new AcuityLogic();
	acuityLogic.scheduleAppointment(req.query, function (status, data) {
		res.status(status).send(data);
	});
});

//get email
router.get('/getEmails', function (req, res) {
	MyLog.log(PREFIX_LOG + "getEmails. userId = " + req.query.userId);
	let acuityLogic = new AcuityLogic();
	acuityLogic.getEmails(req.query, function (status, data) {
		res.status(status).send(data);
	});
});

//get agenda
router.get('/getAgenda', function (req, res) {
	MyLog.log(PREFIX_LOG + "getAgenda. userId = " + req.query.userId);
	let acuityLogic = new AcuityLogic();
	acuityLogic.getAgenda(req.query, function (status, data) {
		res.status(status).send(data);
	});
});

//get old customers
router.get('/getOldCustomers', function (req, res) {
	MyLog.log(PREFIX_LOG + "getOldCustomers. userId = " + req.query.userId);
	let acuityLogic = new AcuityLogic();
	acuityLogic.getOldCustomers(req.query, function (status, data) {
		res.status(status).send(data);
	});
});

//promote old customers
router.post('/promoteOldCustomers', function (req, res) {
	MyLog.log(PREFIX_LOG + "promoteOldCustomers. userId = " + req.query.userId);
	let acuityLogic = new AcuityLogic();
	acuityLogic.promoteOldCustomers(zoiBot, req.query, function (status, data) {
		res.status(status).send(data);
	});
});

//webhook on scheduling
router.post('/webhook/:id/scheduled', function (req, res) {
	MyLog.log(PREFIX_LOG + "Acuity Webhook Schedule. userId = " + req.params.id);
	let acuityLogic = new AcuityLogic();
	acuityLogic.onAppointmentScheduled(req.params.id, req.body, function (status, data) {
		res.status(status).send(data);
	});
});

module.exports = router;