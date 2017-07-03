const MindbodyApi = require('../ApiHandlers/MindbodyLogic');
const MindbodyFactory = require('../../interfaces/Factories/MindbodyFactory');

module.exports = {

    index: function (req, res) {
        if (req.url.includes('/getAgenda')) {
	  this.getAgenda(req, res);
        }
    },

    getAgenda: function (req, res) {
        let mindbodyApi = new MindbodyApi({});

        mindbodyApi.getAppointments({}).then(function (appointments) {
	  res.status(200).send({
	      result: MindbodyFactory.generateAppointmentsList(appointments)
	  })
        });
    }
};