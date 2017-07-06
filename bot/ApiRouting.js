const AppointmentApiLogic = require('../logic/ApiLogic/AppointmentApiLogic');
const UserApiLogic = require('../logic/ApiLogic/UserApiLogic');

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
    }
};