/**
 * Created by Yair on 7/4/2017.
 */
const MindbodyApi = require('../ApiHandlers/MindbodyLogic');
const MindbodyFactory = require('../../interfaces/Factories/MindbodyFactory');
const AcuityLogic = require('../ApiHandlers/AcuitySchedulingLogic');
const Util = require('util');

function AppointmentApiLogic() {

}

AppointmentApiLogic.prototype.getAppointments = function (res) {

	let acuityLogic = new AcuityLogic();

	mindbodyApi.getAppointments({}).then(function (appointments) {
		res.status(200).send({
			result: MindbodyFactory.generateAppointmentsList(appointments)
		})
	}).catch(function (err) {
		Util.log(err);
		Util.log("Failed to get appointments");
	});

};

module.exports = AppointmentApiLogic;