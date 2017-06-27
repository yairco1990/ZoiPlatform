/**
 * Created by Yair on 6/20/2017.
 */

const Util = require('util');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment');
const facebookResponse = require('../../interfaces/FacebookResponse');
const MindbodyLogic = require('../ApiHandlers/MindbodyLogic');
const SharedAppointment = require('../../interfaces/SharedModels/SharedAppointment');
const SharedCustomer = require('../../interfaces/SharedModels/SharedCustomer');
const SharedEmployee = require('../../interfaces/SharedModels/SharedEmployee');

const delayTime = 3000;

function AppointmentLogic() {
    //get the single instance of DBManager
    this.DBManager = require('../../dal/DBManager');
    this.mindbodyLogic = new MindbodyLogic({});
}

/**
 * process the user input
 */
AppointmentLogic.prototype.processIntent = function (conversationData, user, setBotTyping, requestObj, callback) {
    let self = this;

    switch (conversationData.intent) {
        case "appointment what is my schedule":
	  self.getAppointments(user, conversationData, callback);
	  break;
        case "appointment bring next free slot":
	  setBotTyping();
	  self.getNextFreeSlot(user, conversationData, callback);
	  break;
    }
};

/**
 * get appointments
 */
AppointmentLogic.prototype.getAppointments = function (user, conversationData, callback) {
    let self = this;

    callback(facebookResponse.getTextMessage("Let me see..."), true);

    setTimeout(function () {
        //get appointments for today
        self.mindbodyLogic.getAppointments(conversationData.entities).then(function (appointments) {

	  let result = "";//
	  appointments.forEach(function (q, index) {
	      let sharedAppointment = new SharedAppointment(
		q.StartDateTime,
		q.EndDateTime,
		q.SessionType.Name,
		new SharedEmployee(q.Staff.FirstName, q.Staff.LastName),
		new SharedCustomer(q.Client.FirstName, q.Client.LastName, q.Client.Email, q.Client.MobilePhone));
	      result += (index + 1) + ". " + sharedAppointment.toString();
	  });

	  callback(facebookResponse.getTextMessage(result));

	  setTimeout(function () {
	      callback(facebookResponse.getTextMessage("Anything else?"));
	  }, delayTime);

        }).catch(function (err) {
	  Util.log(err);
	  callback(facebookResponse.getTextMessage("Error..."));
        });
    }, delayTime);
};

const nextFreeSlotQuestions = {
    serviceQuestion: {
        id: 1,
        text: "For which service?",
        field: "serviceObject"
    },
    staffQuestion: {
        id: 2,
        text: "Staff name?",
        field: "staffObject"
    }
};
/**
 * get next free slot
 */
AppointmentLogic.prototype.getNextFreeSlot = function (user, conversationData, callback) {
    let self = this;

    //if this is the start of the conversation
    if (!user.conversationData) {
        //ask which service
        let question = nextFreeSlotQuestions.serviceQuestion;

        //save conversation to the user
        user.conversationData = conversationData;
        //save the service question
        user.conversationData.lastQuestion = question;
        //create session object to store the user data during the session
        user.conversationData.session = {};
        //save the user
        self.DBManager.saveUser(user).then(function () {
	  callback(facebookResponse.getTextMessage(question.text));
        });
    }
    else if (user.conversationData.lastQuestion.id === nextFreeSlotQuestions.serviceQuestion.id) {

        //get the services list
        self.mindbodyLogic.getSessionTypes().then(function (services) {
	  //get the service by the user input
	  //save the service object to the session
	  user.conversationData.session[user.conversationData.lastQuestion.field] = MyUtils.getSimilarityFromArray(conversationData.input, services, 'Name');

	  let question = nextFreeSlotQuestions.staffQuestion;

	  //save the staff question
	  user.conversationData.lastQuestion = question;
	  //save the user
	  self.DBManager.saveUser(user).then(function () {
	      callback(facebookResponse.getTextMessage(question.text));
	  });
        });
    }
    else if (user.conversationData.lastQuestion.id === nextFreeSlotQuestions.staffQuestion.id) {

        //save the staff name to the session object
        user.conversationData.session[user.conversationData.lastQuestion.field] = conversationData.input;

        //get the next free slot with the service id
        self.mindbodyLogic.getNextFreeSlot({sessionTypeId: user.conversationData.session.serviceObject.ID}).then(function (slots) {
	  //save the user
	  self.DBManager.saveUser(user).then(function () {
	      callback(facebookResponse.getTextMessage(JSON.stringify(user.conversationData.session)));

	      user.conversationData = null;
	      self.DBManager.saveUser(user).then(function () {
	          //TODO for debug
		callback(facebookResponse.getTextMessage("conversation cleaned"));
	      });
	  });
        });
    }
};

module.exports = AppointmentLogic;