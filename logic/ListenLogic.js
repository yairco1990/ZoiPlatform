let MindbodyLogic = require('./MindbodyLogic');
let BookerplusLogic = require('./BookerplusLogic');
let requestify = require('requestify');
let Util = require('util');
let MyUtils = require('../interfaces/utils');
let moment = require('moment');
let facebookResponse = require('../interfaces/FacebookResponse');

/**
 * listen constructor
 * @constructor
 */
function ListenLogic() {
    this.mindbodyLogic = new MindbodyLogic("4294f8146f2ccae058f4008aa73b98a1");
    this.bookerplusLogic = new BookerplusLogic("eyJjdHkiOiJ0ZXh0XC9wbGFpbiIsImFsZyI6IkhTMjU2In0.eyJzZXNzaW9uVG9rZW4iOiI1OGZjMGNkOS01MjJlLTQzZmMtODI4Yi01YmFhZTEzZmY2ZGEiLCJpZCI6MTgzNCwidHlwZSI6MX0.cxiL0yX4knjiRJlUGutB0CIsQaRsddyLreHURZVFH4o");
}

/**
 * process the user input
 * @param input
 * @param callback
 */
ListenLogic.prototype.processInput = function (input, callback) {

    let self = this;

    requestify.request('http://52.174.244.154:8080/zoi/getIntent?text=' + input, {
        method: 'GET'
    }).then(function (response) {

        let zoiResult = response.getBody();

        //TODO change intent from input to zoiResult intent
        let intent = input;//zoiResult.intent;
        let entities = zoiResult.entities;

        Util.log("Zoi got input: " + input);
        Util.log("Zoi understood: " + intent);
        Util.log("Zoi entities: " + entities);

        //TODO this is arab
        if (entities.date) {
	  entities.date = entities.date.replace('at', '');
	  entities.date = entities.date.replace('in', '');
        }
        intent = intent.toLowerCase();


        if (intent.includes('hey')) {
	  callback(200, {"text": "Hey boss! What can I do for you?"});
        } else if (intent.includes('my schedule')) {
	  //TODO this is arab
	  entities.date = "today";
	  self.bookerplusLogic.getQueues(entities, null, function (status, message) {
	      callback(status, message);
	  });
        } else if (intent.includes('classes')) {

	  self.mindbodyLogic.getClasses(entities, function (status, data) {
	      callback(status, self.generateFacebookResponse(data));
	  });

        } else if (intent.includes('sales')) {

	  self.mindbodyLogic.getSales(entities, function (status, data) {
	      callback(status, self.generateFacebookResponse(data));
	  });

        } else if (intent.includes('show customer card')) {

	  if (entities.SYSTEM == "mindbody") {
	      self.mindbodyLogic.getClients(entities, function (status, data) {
		callback(status, self.generateFacebookResponse(data));
	      });
	  } else {
	      self.bookerplusLogic.getClient(entities, function (status, message) {
		callback(status, message);
	      });
	  }

        } else if (intent.includes('get services')) {

	  if (entities.SYSTEM == "mindbody") {

	  } else {
	      self.bookerplusLogic.getServices(entities, function (status, message) {
		callback(status, message);
	      });
	  }

        } else if (intent.includes('get queues')) {

	  if (entities.SYSTEM == "mindbody") {

	  } else {
	      self.bookerplusLogic.getQueues(entities, null, function (status, message) {
		callback(status, message);
	      });
	  }

        } else if (intent.includes('get next queue')) {

	  if (entities.SYSTEM == "mindbody") {

	  } else {
	      self.bookerplusLogic.getNextQueue(entities, function (status, message) {
		callback(status, message);
	      });
	  }

        } else if (intent.includes('Book an appointment')) {

	  if (entities.SYSTEM == "mindbody") {

	  } else {
	      self.bookerplusLogic.scheduleQueue(entities, function (status, message) {
		callback(status, message);
	      });
	  }

        } else {
	  callback(200, {"text": 'No data found'});
        }

    }).catch(function (err) {
        callback(200, {"text": 'server error'});
        Util.log(err);
    });
};

/**
 * process inputs and return mock response
 * @param input
 * @param callback
 */
ListenLogic.prototype.processMock = function (input, callback) {
    let self = this;

    input = input.toLowerCase();

    if (input.includes("hey zoi") || input.includes("hi zoi")) {

        let delayTime = 4500;

        callback(200, facebookResponse.getRegularMessage("I noticed something 😮"));

        setTimeout(function () {
	  callback(200, facebookResponse.getRegularMessage("This month revenue went down by 20% compared to last month"));

	  //image message response take a while
	  setTimeout(function () {
	      callback(200, facebookResponse.getImageMessage("http://118.97.51.140:1001/iacm_dashboard/assets/img/bpkp/dashboard.png"));

	      setTimeout(function () {
		callback(200, facebookResponse.getRegularMessage("I think it's because you had more private sessions than group sessions"));

		setTimeout(function () {
		    callback(200, facebookResponse.getRegularMessage("Let's offer a promotion for your group sessions to your relevant customers?"));

		    setTimeout(function () {
		        callback(200, facebookResponse.getButtonMessage("Do you want to send promotion?", [
			  facebookResponse.getGenericButton("postback", "Yes, I want to send promotion to my best customer", {
			      type: "Yes, I want to send promotions"
			  }),
			  facebookResponse.getGenericButton("postback", "No, I don't want to send a promotion", {
			      type: "No, I don't want to send a promotion"
			  })
		        ]));
		    }, delayTime);
		}, delayTime);

	      }, delayTime + 3000);

	  }, 0);
        }, delayTime);

    } else {
        callback(200, facebookResponse.getRegularMessage("Can you be more explicit?"))
    }
};

/**
 * generate the data we got from zoho to text response
 */
ListenLogic.prototype.generateFacebookResponse = function (data) {
    return {"text": data};
};

module.exports = ListenLogic;