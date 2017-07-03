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
	      q.StartDateTime,
	      q.EndDateTime,
	      q.SessionType.Name,
	      new SharedEmployee(q.Staff.FirstName, q.Staff.LastName),
	      new SharedCustomer(q.Client.FirstName, q.Client.LastName, q.Client.Email, q.Client.MobilePhone));

	  appointmentsList.push(sharedAppointment);
        });

        return appointmentsList;
    }

};