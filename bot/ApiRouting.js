const AppointmentApiLogic = require('../logic/ApiLogic/AppointmentApiLogic');
const UserApiLogic = require('../logic/ApiLogic/UserApiLogic');
const AcuityLogic = require('../logic/AcuityLogic/AcuityLogic');
const GmailLogic = require('../logic/GmailLogic');
const Acuity = require('acuityscheduling');
const zoiConfig = require('../config');

module.exports = {

	setApiRouting: function (app) {

		//get user
		app.get('/api/getUser', function (req, res) {
			let userApiLogic = new UserApiLogic();
			userApiLogic.getUser(req.query.facebookId, function (status, data) {
				res.status(status).send(data);
			});
		});

		//save user
		app.post('/api/saveUser', function (req, res) {
			let userApiLogic = new UserApiLogic();
			let user = JSON.parse(req.query.user);
			userApiLogic.saveUser(user, function (status, data) {
				res.status(status).send(data);
			});
		});

		//get agenda
		app.get('/api/getAgenda', function (req, res) {
			let appointmentApiLogic = new AppointmentApiLogic();
			appointmentApiLogic.getAppointments(res);
		});

		//integrate with gmail
		app.get('/gmail/auth', function (req, res) {
			GmailLogic.integrate(req.query.userId, function (status, data) {
				res.writeHead(status, data);
				res.send();
			});
		});

		//get here after the user accept permissions
		app.get('/gmail/oauthcallback', function (req, res) {
			GmailLogic.getTokens(req.query.state, req.query.code, function (status, data) {
				res.writeHead(status, data);
				res.send();
			});
		});

		app.get('/acuity/authorize', function (req, res) {
			let acuity = Acuity.oauth(zoiConfig.Acuity);
			acuity.authorizeRedirect(res, {scope: 'api-v1', state: req.query.facebookId});
		});

		//oauth2 for acuity
		app.get('/acuity/oauth2', function (req, res) {
			let acuityLogic = new AcuityLogic(req, res);
			acuityLogic.integrate(req.query.state, req.query.code, function (status, data) {
				res.writeHead(status, data);
				res.send();
			});
		});

		//get clients
		app.get('/acuity/getClients', function (req, res) {
			let acuityLogic = new AcuityLogic(req, res);
			acuityLogic.getClients(req.query.facebookId, function (status, data) {
				res.status(status).send(data);
			});
		});

		//getAvailability
		app.get('/acuity/getAvailability', function (req, res) {
			let acuityLogic = new AcuityLogic(req, res);
			acuityLogic.getAvailability(req.query.facebookId, function (status, data) {
				res.status(status).send(data);
			});
		});

		//get appointment types
		app.get('/acuity/getAppointmentTypes', function (req, res) {
			let acuityLogic = new AcuityLogic(req, res);
			acuityLogic.getAppointmentTypes(req.query.facebookId, function (status, data) {
				res.status(status).send(data);
			});
		});

		//get appointment types
		app.get('/acuity/sendPromotions', function (req, res) {
			let acuityLogic = new AcuityLogic(req, res);
			acuityLogic.sendPromotions(req.query.facebookId, function (status, data) {
				res.status(status).send(data);
			});
		});

		//schedule appointment
		app.get('/acuity/scheduleAppointment', function (req, res) {
			let acuityLogic = new AcuityLogic(req, res);
			acuityLogic.scheduleAppointment(req.query, function (status, data) {
				res.status(status).send(data);
			});
		});

		//get email
		app.get('/acuity/getEmails', function (req, res) {
			let acuityLogic = new AcuityLogic(req, res);
			acuityLogic.getEmails(req.query, function (status, data) {
				res.status(status).send(data);
			});
		});

		//get agenda
		app.get('/acuity/getAgenda', function (req, res) {
			let acuityLogic = new AcuityLogic(req, res);
			acuityLogic.getAgenda(req.query, function (status, data) {
				res.status(status).send(data);
			});
		});
	}
};