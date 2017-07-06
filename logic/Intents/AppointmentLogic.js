/**
 * Created by Yair on 6/20/2017.
 */

const Util = require('util');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment');
const facebookResponse = require('../../interfaces/FacebookResponse');
const MindbodyLogic = require('../ApiHandlers/MindbodyLogic');
const MindbodyFactory = require('../../interfaces/Factories/MindbodyFactory');

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
        case "appointment book for customer":
	  setBotTyping();
	  self.bookForCustomer(user, conversationData, callback);
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

        callback(facebookResponse.getButtonMessage("This is your schedule for today sir:", [
	  facebookResponse.getGenericButton("web_url", "Watch your schedule", null, "http://zoiai.com/#/agenda", "tall")
        ]));

        setTimeout(function () {
	  callback(facebookResponse.getTextMessage("Anything else?"));
        }, delayTime);

    }, delayTime);
};

const nextFreeSlotQuestions = {
    serviceQuestion: {
        id: 1,
        text: "For which service?",
        field: "serviceObject"
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
        // user.session = {};
        //save the user
        self.DBManager.saveUser(user).then(function () {
	  callback(facebookResponse.getTextMessage(question.text));
        });
    }
    else if (user.conversationData.lastQuestion.id === nextFreeSlotQuestions.serviceQuestion.id) {

        //get the services list
        self.mindbodyLogic.getSessionTypes().then(function (services) {

	  user.session = {};
	  //get the service by the user input
	  user.session[user.conversationData.lastQuestion.field] = MyUtils.getSimilarityFromArray(conversationData.input, services, 'Name');

	  //get the next free slot with the service id
	  self.mindbodyLogic.getNextFreeSlot({sessionTypeId: user.session.serviceObject.ID}).then(function (slots) {

	      let responseText = "";
	      if (slots.length) {
		let slot = slots[1];
		responseText = "The next free slot for " + user.session.serviceObject.Name + " is at " + moment(slot.StartDateTime).format("HH:mm MM/DD");

		user.session.nextFreeSlot = slot;
	      } else {
		responseText = "There are no available slots for this service";
	      }

	      //clean conversation data
	      user.conversationData = null;

	      self.DBManager.saveUser(user).then(function () {
		callback(facebookResponse.getTextMessage(responseText));

		setTimeout(function () {
		    callback(facebookResponse.getTextMessage("Is there another thing you want to do sir?"))
		}, delayTime);
	      });
	  });
        });
    }
};

/**
 * book for customer for free slot
 * the session must contains details about free slot!
 * @param user
 * @param conversationData
 * @param callback
 */
AppointmentLogic.prototype.bookForCustomer = function (user, conversationData, callback) {
    let self = this;

    //validate request
    if (!conversationData.entities.CUSTOMER && !conversationData.entities.person) {
        callback(facebookResponse.getTextMessage("Need details about the customer"));
        return;
    }
    if (!user.session || !user.session.nextFreeSlot) {
        callback(facebookResponse.getTextMessage("Need details about the required slot"));
        return;
    }

    self.mindbodyLogic.getClients(conversationData.entities).then(function (customers) {
        if (!customers.length) {
	  callback(facebookResponse.getTextMessage("Didn't found customer with this name"));
	  return;
        }

        let customer = customers[0];
        let slot = user.session.nextFreeSlot;

        let appointmentObject = {
	  Appointments: {
	      Appointment: {
		Location: {
		    ID: slot.Location.ID
		},
		Staff: {
		    ID: slot.Staff.ID
		},
		Client: {
		    ID: customer.ID
		},
		SessionType: {
		    ID: slot.SessionType.ID
		},
		StartDateTime: moment(slot.StartDateTime).format('YYYY-MM-DDTHH:mm:ss')
	      }
	  },
	  UpdateAction: "AddNew"
        };
        self.mindbodyLogic.bookAppointment(appointmentObject).then(function (result) {
	  console.log(result);
	  callback(facebookResponse.getTextMessage("Booked successfully for " + customer.FirstName + " " + customer.LastName));
        }).catch(function (err) {
	  if (err.errorReason) {
	      callback(facebookResponse.getTextMessage(err.errorReason));
	  } else {
	      callback(facebookResponse.getTextMessage("Try to book for " + customer.FirstName));
	  }
        });
    });
};

module.exports = AppointmentLogic;