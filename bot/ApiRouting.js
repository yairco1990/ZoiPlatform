const AppointmentApiLogic = require('../logic/ApiLogic/AppointmentApiLogic');
const UserApiLogic = require('../logic/ApiLogic/UserApiLogic');
const AcuityLogic = require('../logic/AcuityLogic/AcuityLogic');
const GmailLogic = require('../logic/GmailLogic');
const Acuity = require('acuityscheduling');
const zoiConfig = require('../config');
const Util = require('util');

const API_LOG = "Api Request -> ";

module.exports = {

	setApiRouting: function (app, bot) {

		//get user
		app.get('/api/getUser', function (req, res) {
			Util.log(API_LOG + "getUser. userId = " + req.query.facebookId);
			let userApiLogic = new UserApiLogic();
			userApiLogic.getUser(req.query.facebookId, function (status, data) {
				res.status(status).send(data);
			});
		});

		//save user
		app.post('/api/saveUser', function (req, res) {
			Util.log(API_LOG + "saveUser. userId = " + req.query.user.id);
			let userApiLogic = new UserApiLogic();
			let user = JSON.parse(req.query.user);
			userApiLogic.saveUser(user, function (status, data) {
				res.status(status).send(data);
			});
		});

		//get agenda
		// app.get('/api/getAgenda', function (req, res) {
		// 	Util.log(API_LOG + "getAgenda. userId = " + req.query.facebookId);
		// 	let appointmentApiLogic = new AppointmentApiLogic();
		// 	appointmentApiLogic.getAppointments(res);
		// });

		//integrate with gmail
		app.get('/gmail/auth', function (req, res) {
			Util.log(API_LOG + "integrateWithGmail. userId = " + req.query.userId);
			GmailLogic.integrate(req.query.userId, function (status, data) {
				res.writeHead(status, data);
				res.send();
			});
		});

		//get here after the user accept permissions
		app.get('/gmail/oauthcallback', function (req, res) {
			Util.log(API_LOG + "oAuthGmail. userId = " + req.query.state);
			GmailLogic.getTokens(req.query.state, req.query.code, function (status, data) {
				res.writeHead(status, data);
				res.send();
			});
		});

		app.get('/acuity/authorize', function (req, res) {
			Util.log(API_LOG + "Authorize Acuity. userId = " + req.query.facebookId);
			let acuity = Acuity.oauth(zoiConfig.Acuity);
			acuity.authorizeRedirect(res, {scope: 'api-v1', state: req.query.facebookId});
		});

		//oauth2 for acuity
		app.get('/acuity/oauth2', function (req, res) {
			Util.log(API_LOG + "oAuth Acuity. userId = " + req.query.state);
			let acuityLogic = new AcuityLogic();
			acuityLogic.integrate(req.query.state, req.query.code, function (status, data) {
				res.writeHead(status, data);
				res.send();
			});
		});

		//get clients
		app.get('/acuity/getClients', function (req, res) {
			Util.log(API_LOG + "getClients. userId = " + req.query.facebookId);
			let acuityLogic = new AcuityLogic();
			acuityLogic.getClients(req.query.facebookId, function (status, data) {
				res.status(status).send(data);
			});
		});

		//getAvailability
		app.get('/acuity/getAvailability', function (req, res) {
			Util.log(API_LOG + "getAvailability. userId = " + req.query.facebookId);
			let acuityLogic = new AcuityLogic();
			acuityLogic.getAvailability(req.query.facebookId, function (status, data) {
				res.status(status).send(data);
			});
		});

		//get appointment types
		app.get('/acuity/getAppointmentTypes', function (req, res) {
			Util.log(API_LOG + "getAppointments. userId = " + req.query.facebookId);
			let acuityLogic = new AcuityLogic();
			acuityLogic.getAppointmentTypes(req.query.facebookId, function (status, data) {
				res.status(status).send(data);
			});
		});

		//get appointment types
		app.get('/acuity/sendPromotions', function (req, res) {
			Util.log(API_LOG + "sendPromotions. userId = " + req.query.facebookId);
			let acuityLogic = new AcuityLogic();
			acuityLogic.sendPromotions(req.query.facebookId, function (status, data) {
				res.status(status).send(data);
			});
		});

		//schedule appointment
		app.get('/acuity/scheduleAppointment', function (req, res) {
			Util.log(API_LOG + "scheduleAppointment. userId = " + req.query.ownerId);
			let acuityLogic = new AcuityLogic();
			acuityLogic.scheduleAppointment(req.query, function (status, data) {
				res.status(status).send(data);
			});
		});

		//get email
		app.get('/acuity/getEmails', function (req, res) {
			Util.log(API_LOG + "getEmails. userId = " + req.query.ownerId);
			let acuityLogic = new AcuityLogic();
			acuityLogic.getEmails(req.query, function (status, data) {
				res.status(status).send(data);
			});
		});

		//get agenda
		app.get('/acuity/getAgenda', function (req, res) {
			Util.log(API_LOG + "getAgenda. userId = " + req.query.ownerId);
			let acuityLogic = new AcuityLogic();
			acuityLogic.getAgenda(req.query, function (status, data) {
				res.status(status).send(data);
			});
		});

		//webhook on scheduling
		app.post('/acuity/webhook/:id/scheduled', function (req, res) {
			Util.log(API_LOG + "Acuity Webhook Schedule. userId = " + req.params.id);
			let acuityLogic = new AcuityLogic();
			acuityLogic.onAppointmentScheduled(req.params.id, req.body, bot, function (status, data) {
				res.status(status).send(data);
			});
		});
	}
};