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
				minDate: MyUtils.convertToAcuityDate(),
				maxDate: MyUtils.convertToAcuityDate(moment().endOf('day'))
			});
		}).then(function (appoitnemnts) {
			callback(200, AcuityFactory.generateAppointmentsList(appoitnemnts));
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

					let messagePromises = [];

					messages.forEach(function (m) {
						messagePromises.push(GmailLogic.getMessage(tokens, m.id, 'me'));
					});

					return Promise.all(messagePromises);

				}).then(function (messages) {

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


			}).catch(function (err) {

				Util.log("Error:");
				Util.log(err);
			});
		});
	}
}

module.exports = AcuityLogic;