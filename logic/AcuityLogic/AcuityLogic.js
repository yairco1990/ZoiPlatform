/**
 * Created by Yair on 7/4/2017.
 */
const AcuityApi = require('../ApiHandlers/AcuitySchedulingLogic');
const Util = require('util');
const moment = require('moment');

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
				return;
			})
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
				callback(302, {'location': 'http://localhost:63343/ZoiClient/index.html#/main?facebookId=' + userId});


			}).catch(function (err) {

				Util.log("Error:");
				Util.log(err);
			});
		});

	}
	;
}

module.exports = AcuityLogic;