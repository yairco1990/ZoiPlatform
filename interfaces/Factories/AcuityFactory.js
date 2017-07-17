/**
 * Created by Yair on 7/3/2017.
 */
const SharedAppointment = require('../SharedModels/SharedAppointment');
const SharedCustomer = require('../SharedModels/SharedCustomer');
const SharedEmployee = require('../SharedModels/SharedEmployee');

module.exports = {

	/**
	 * generate appointments list
	 * @param appointments
	 * @returns {Array}
	 */
	generateAppointmentsList: function (appointments) {
		let appointmentsList = [];

		appointments.forEach(function (q, index) {
			let sharedAppointment = new SharedAppointment(
				q.time,
				q.endTime,
				q.type,
				null,
				new SharedCustomer(q.firstName, q.lastName, q.email, q.phone, null));

			appointmentsList.push(sharedAppointment);
		});

		return appointmentsList;
	}

};