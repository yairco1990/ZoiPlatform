/**
 * Created by Yair on 7/4/2017.
 */
const AcuityApi = require('../ApiHandlers/AcuitySchedulingLogic');
const Util = require('util');
const moment = require('moment');
const ZoiConfig = require('../../config');
const GmailLogic = require('../GmailLogic');
const _ = require('underscore');
const MyUtils = require('../../interfaces/utils');
const AcuityFactory = require('../../interfaces/Factories/AcuityFactory');
const requestify = require('requestify');
const facebookResponse = require('../../interfaces/FacebookResponse');
const ClientLogic = require('../Intents/ClientLogic');

class AcuityLogic {

	constructor() {
		this.DBManager = require('../../dal/DBManager');
	}

	getClients(userId, callback) {
		let self = this;

		self.DBManager.getUser({_id: userId}).then(function (user) {
			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			acuityApi.getClients().then(function (result) {
				callback(200, result);
			})
		});
	}

	getAvailability(userId, callback) {
		let self = this;

		self.DBManager.getUser({_id: userId}).then(function (user) {
			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			let options = [
				{key: 'appointmentTypeID', value: 3581890},
				{key: 'date', value: moment().add(1, 'days').format('YYYY-MM-DDTHH:mm:ss')}
			];

			acuityApi.getAvailability(options).then(function (result) {
				callback(200, result);
			})
		});
	}

	getAppointmentTypes(userId, callback) {
		let self = this;

		self.DBManager.getUser({_id: userId}).then(function (user) {
			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			acuityApi.getAppointmentTypes().then(function (result) {
				callback(200, result);
			})
		});
	}

	sendPromotions(userId, callback) {
		let self = this;

		self.DBManager.getUser({_id: userId}).then(function (user) {
			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			let options = [
				{key: 'appointmentTypeID', value: 3581890},
				{key: 'date', value: moment().add(1, 'days').format('YYYY-MM-DDTHH:mm:ss')}
			];

			return acuityApi.getAvailability(options);
		}).then(function (slots) {

			//iterate slots
			slots.forEach(function (slot) {
				callback(200, slot);
			})
		});
	}

	getAgenda(data, callback) {
		let self = this;

		self.DBManager.getUser({_id: data.ownerId}).then(function (user) {
			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			return acuityApi.getAppointments({
				minDate: MyUtils.convertToAcuityDate(moment().startOf('day')),
				maxDate: MyUtils.convertToAcuityDate(moment().endOf('day'))
			});
		}).then(function (appointments) {

			//sort appointments
			appointments.sort(function (q1, q2) {
				if (moment(q1.datetime).isAfter(moment(q2.datetime))) {
					return 1;
				} else {
					return -1;
				}
			});

			callback(200, AcuityFactory.generateAppointmentsList(appointments));
		}).catch(function (err) {
			callback(401, err);
		});
	}

	scheduleAppointment(data, callback) {
		let self = this;

		self.DBManager.getUser({_id: data.ownerId}).then(function (user) {
			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			// Create appointment:
			let options = {
				method: 'POST',
				body: {
					//remove the timezone
					datetime: data.datetime.substring(0, 19),
					appointmentTypeID: data.appointmentTypeID,
					firstName: data.firstname,
					lastName: data.lastname,
					email: data.email,
					notes: data.notes
				}
			};
			if (data.certificate) {
				options.body.certificate = data.certificate;
			}

			return acuityApi.scheduleAppointment(options);
		}).then(function () {

			callback(200, {});
		}).catch(function (err) {

			callback(401, err);
		});
	}

	getEmails(data, callback) {

		let self = this;

		self.DBManager.getUser({_id: data.ownerId}).then(function (user) {

			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);
			let tokens = user.integrations.Gmail;

			acuityApi.getClients().then(function (clients) {

				let queryString = "newer_than:7d is:unread";

				//get unread emails from the user clients
				GmailLogic.getEmailsList(tokens, queryString, 'me').then(function (messages) {

					let clientsMessages = _.filter(messages, function (item1) {
						return _.some(this, function (item2) {
							return item1.from.includes(item2.email);
						});
					}, clients);

					callback(200, clientsMessages);
				}).catch(function (err) {
					callback(401, err);
				});
			}).catch(function (err) {
				callback(401, err);
			});
		}).catch(function (err) {
			callback(401, err);
		});
	}

	onAppointmentScheduled(ownerId, data, bot, callback) {
		let self = this;

		let acuityApi;
		let _user;
		//get the user that wants to integrate
		self.DBManager.getUser({_id: ownerId}).then(function (user) {

			_user = user;

			acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			return acuityApi.getAppointments(null, 'appointments/' + data.id);

		}).then(function (appointment) {

			let options = {
				firstName: appointment.firstName,
				lastName: appointment.lastName
			};

			return acuityApi.getAppointments(options);

		}).then(function (appointments) {

			//if (appointments.length < 2) {
			let appointment = appointments[0];
			let client = {
				firstName: appointment.firstName,
				lastName: appointment.lastName
			};

			let clientLogic = new ClientLogic(_user);
			let conversationData = {
				intent: "client new customer join",
				context: "CLIENT"
			};
			//start the conversation in the clientLogic class
			clientLogic.processIntent(conversationData, null, null, function (msg, setTyping) {
				bot.sendMessage(_user._id, msg, function () {
					if (setTyping) {
						bot.sendSenderAction(_user._id, "typing_on");
					}
				});
			});

			callback(200, {message: "It's a new customer"});
			//} else {
			//	callback(200, {message: "Not a new customer"});
			//}

		}).catch(MyUtils.getErrorMsg(function (err) {
			callback(400, err);
		}));
	}

	integrate(userId, code, callback) {

		let self = this;

		//get the user that wants to integrate
		self.DBManager.getUser({_id: userId}).then(function (user) {

			//get acuity details
			AcuityApi.getUserAndToken(code).then(function (userData) {

				//if there are no integrations at all
				if (!user.integrations) user.integrations = {};

				//set integration
				user.integrations.Acuity = userData;

				//save user with the integration
				return self.DBManager.saveUser(user);

			}).then(function () {

				//redirect the user to his integrations page
				callback(302, {'location': ZoiConfig.clientUrl + '/main?facebookId=' + userId});

				let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

				//register for Acuity webhooks
				let options = {
					method: 'POST',
					body: {
						event: "appointment.scheduled",
						target: ZoiConfig.serverUrl + "/acuity/webhook/" + userId + "/scheduled"
					}
				};
				return acuityApi.setWebhooks(options);

			}).then(function (response) {

				Util.log("Response");
				Util.log(response);

			}).catch(MyUtils.getErrorMsg());
		});
	}
}

module.exports = AcuityLogic;