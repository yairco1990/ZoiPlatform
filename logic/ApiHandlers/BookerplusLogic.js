let requestify = require('requestify');
let fs = require('fs');
let Util = require('util');
let moment = require('moment-timezone');

let DATABASE = {
    timezone: "Asia/Jerusalem"
};

function BookerplusLogic(authtoken) {
    this.authtoken = authtoken;
}

BookerplusLogic.prototype.getClient = function (entities, callback) {

    let self = this;

    let url = "https://bookerplus.booker-plus.com:8443/bookerplus_prod/services/auth/employee/customer";

    let searchQuery;
    if (entities.person || entities.CUSTOMER) {
        searchQuery = entities.person || entities.CUSTOMER;
    } else {
        searchQuery = "";
    }

    requestify.request(url, {
        method: 'GET',
        params: {
	  searchQuery: searchQuery,
	  numOfResults: 1
        },
        headers: {
	  'Authorization': self.authtoken
        },
        dataType: 'json'
    }).then(function (data) {

        data = data.getBody();

        let resultClient = data.result[0];

        let myResult = "";

        if (resultClient) {

	  //save client
	  DATABASE.customer = resultClient;

	  myResult += "The client that zoi found is " + resultClient.firstname + " " + resultClient.lastname + ".";
	  if (resultClient.mobile) {
	      myResult += " His mobile number is " + resultClient.mobile + ".";
	  }
	  if (resultClient.email) {
	      myResult += " His Email is " + resultClient.email + ".";
	  }
	  if (resultClient.address) {
	      myResult += " His address is " + resultClient.address + ".";
	  }
        } else {
	  myResult = "Zoi didn't find client with the name " + args.Request.SearchText;
        }

        let response = {
	  "attachment": {
	      "type": "template",
	      "payload": {
		"template_type": "generic",
		"elements": [
		    {
		        "title": "Customer Card",
		        "image_url": resultClient.picUrl,
		        "subtitle": myResult
		        // "buttons": [
		        //  {
		        //      "type": "postback",
		        //      "title": "Show customer details",
		        //      "payload": "DEVELOPER_DEFINED_PAYLOAD"
		        //  }, {
		        //      "type": "postback",
		        //      "title": "Book an appointment",
		        //      "payload": "DEVELOPER_DEFINED_PAYLOAD"
		        //  }
		        // ]
		    }
		]
	      }
	  }
        };


        callback(200, response);
        // callback(200, {"text": myResult});
    });
};

/**
 * get services
 * @param entities
 * @param callback
 * return all services in text message
 */
BookerplusLogic.prototype.getServices = function (entities, callback) {

    let self = this;

    //get services object
    self.getServicesObject()
        .then(function (services) {
	  let myResult = "";

	  if (services && services.length > 0) {

	      //save services
	      DATABASE.services = services;

	      services.forEach(function (service) {
		myResult += service.name + "\n";
	      });

	      callback(200, {"text": myResult});
	  } else {

	      callback(200, {"text": "There are no services in your service"});
	  }
        }, function (err) {
	  Util.log(err);
	  callback(200, {"text": "What exactly do you mean?"});
        });
};

/**
 * get services object
 * @returns {Promise}
 */
BookerplusLogic.prototype.getServicesObject = function () {

    let self = this;

    return new Promise(function (resolve, reject) {
        let url = "https://bookerplus.booker-plus.com:8443/bookerplus_prod/services/auth/employee/branchService";

        requestify.request(url, {
	  method: 'GET',
	  params: {},
	  headers: {
	      'Authorization': self.authtoken
	  },
	  dataType: 'json'
        }).then(function (data) {

	  data = data.getBody();

	  let result = data.result;

	  if (data.responseType == "SUCCESS") {

	      resolve(result);
	  } else {

	      reject(data.responseType);
	  }
        }).catch(function (err) {

	  reject(err);
        });
    });
};

/**
 * get queue week ago
 * @param entities - from zoi
 * @param params - if exist, override the others
 * @param callback
 * return text message
 */
BookerplusLogic.prototype.getQueues = function (entities, params, callback) {

    let self = this;

    if (!params) {
        params = {
	  startTime: new Date().valueOf() - (1000 * 60 * 60 * 24 * 7), //week ago
	  endTime: new Date().valueOf()
        };

        //aTODO
        if (entities && entities.date == 'today') {
	  params.startTime = moment().startOf('day').unix() * 1000; // set to 12:00 am today
	  params.endTime = moment().endOf('day').unix() * 1000; // set to 23:59 pm today
        }
    }

    //get queues object
    self.getQueuesObject(params)
        .then(function (queues) {

	  if (queues && queues.length > 0) {

	      //aTODO save queues
	      DATABASE.weekQueues = queues;

	      let queuesList = [];
	      let lastQueueTime;

	      //run until the length or 4 - the shorter between them
	      for (let i = 0; i < queues.length && i < 4; i++) {

		let queue = queues[i];

		if (queue.forEmployee) {
		    queuesList.push({
		        "title": "Appointment for " + queue.customer.firstname + " " + queue.customer.lastname + " at " + moment(queue.estimatedServiceTime).format('lll'),
		        "image_url": "http://pngimg.com/uploads/clock/clock_PNG6641.png",
		        "subtitle": "Service: " + queue.branchService.name + ". For employee: " + queue.forEmployee.firstname + " " + queue.forEmployee.lastname + "\n",
		        // "default_action": {
		        //  "type": "web_url",
		        // "url": "https://peterssendreceiveapp.ngrok.io/shop_collection",
		        // "messenger_extensions": true,
		        // "webview_height_ratio": "tall",
		        // "fallback_url": "https://peterssendreceiveapp.ngrok.io/"
		        // },
		        // "buttons": [
		        //  {
		        //      "title": "View",
		        // "type": "web_url",
		        // "url": "https://peterssendreceiveapp.ngrok.io/collection",
		        // "messenger_extensions": true,
		        // "webview_height_ratio": "tall",
		        // "fallback_url": "https://peterssendreceiveapp.ngrok.io/"
		        // }
		        // ]
		    });
		}

		//save the last queue time(add some time to get the next and not the current again)
		lastQueueTime = queue.estimatedServiceTime + (1000 * 30);
	      }

	      //add button to get next queues if there are another queues
	      let buttons = null;
	      if (queues.length > queuesList.length) {
		//response button
		buttons = [{
		    "type": "postback",
		    "title": "Bring me later appointments",
		    "payload": JSON.stringify({
		        action: "BRING_NEXT_QUEUES",
		        params: {
			  startTime: lastQueueTime,
			  endTime: params.endTime
		        }
		    })
		}];
	      }

	      let response;

	      if (queuesList.length > 1) {
		response = buildTemplateResponse('list', queuesList, buttons);
	      } else {
		response = buildTemplateResponse('generic', [queuesList[0]]);
	      }

	      callback(200, response);//
	  } else {
	      callback(200, {"text": "There are no queues to show"});
	  }
        })
        .catch(function (err) {

	  Util.log(err);
	  callback(200, {"text": "Zoi is a little bit confused"});
        });
};

/**
 * get next queue
 * @param entities
 * @param callback
 * return the next queue in text message
 */
BookerplusLogic.prototype.getNextQueue = function (entities, callback) {

    let self = this;

    //get services object
    self.getQueuesObject({
        startTime: new Date().valueOf(), //now
        endTime: new Date().valueOf() + (1000 * 60 * 60 * 24 * 7) //week later
    })
        .then(function (queues) {
	  let myResult = "";

	  if (queues && queues.length > 0) {

	      let queue = queues[0];

	      //aTODO save next queue
	      DATABASE.nextQueue = queue;

	      myResult = "The next queue is for " + queue.customer.firstname + " "
		+ queue.customer.lastname + " for " + queue.branchService.name + " for the employee "
		+ queue.forEmployee.firstname + " " + queue.forEmployee.lastname + ", at "
		+ moment(queue.estimatedServiceTime).format('lll') + ".";

	      callback(200, {"text": myResult});
	  } else {
	      callback(200, {"text": "There is no next queue"});
	  }
        }, function (err) {

	  Util.log(err);
	  callback(200, {"text": "What exactly do you mean?"});
        })
        .catch(function (err) {

	  Util.log(err);
	  callback(200, {"text": "Zoi is a little bit confused"});
        });
};

/**
 * schedule queue
 * @param entities
 * @param callback
 * return scheduled queue in text message
 */
BookerplusLogic.prototype.scheduleQueue = function (entities, callback) {

    let self = this;

    //schedule queue object
    self.scheduleQueueObject({
        customerId: DATABASE.customer.id,
        dateTime: moment.tz(entities.date, DATABASE.timezone).unix() * 1000,
        sequenceTemplateId: DATABASE.services[0].sequenceTemplateId,
        forceSchedule: true,
        platform: "zoi",
        forEmployeeId: 1834
    })
        .then(function (queue) {
	  let myResult = "";

	  if (queue) {

	      myResult = "The appointment booked for " + DATABASE.customer.firstname + " "
		+ DATABASE.customer.lastname + ", at "
		+ moment.tz(queue.estimatedServiceTime, DATABASE.timezone).format('lll') + ".";

	      callback(200, {"text": myResult});
	  } else {
	      callback(200, {"text": "There is no next queue"});
	  }
        }, function (err) {

	  Util.log(err);
	  callback(200, {"text": "What exactly do you mean?"});
        })
        .catch(function (err) {

	  Util.log(err);
	  callback(200, {"text": "Zoi is a little bit confused"});
        });
};


/**
 * get queues object
 * @returns {Promise}
 */
BookerplusLogic.prototype.getQueuesObject = function (params) {

    let self = this;

    return new Promise(function (resolve, reject) {
        let url = "https://bookerplus.booker-plus.com:8443/bookerplus_prod/services/auth/employee/queue/getBusinessQueues";

        requestify.request(url, {
	  method: 'GET',
	  params: params,
	  headers: {
	      'Authorization': self.authtoken
	  },
	  dataType: 'json'
        }).then(function (data) {

	  handleServerResponse(resolve, reject, data);

        }).catch(function (err) {

	  reject(err);
        });
    });
};


/**
 * get queues object
 * @returns {Promise}
 */
BookerplusLogic.prototype.scheduleQueueObject = function (params) {

    let self = this;

    return new Promise(function (resolve, reject) {
        let url = "https://bookerplus.booker-plus.com:8443/bookerplus_prod/services/auth/employee/reserved/schedule";

        requestify.request(url, {
	  method: 'POST',
	  params: params,
	  headers: {
	      'Authorization': self.authtoken
	  },
	  dataType: 'form-url-encoded'
        }).then(function (data) {

	  handleServerResponse(resolve, reject, data);

        }).catch(function (err) {

	  reject(err);
        });
    });
};

/**
 *
 * @param templateType - 'list' or 'generic'
 * @param list
 * @param buttons
 * @returns {{attachment: {type: string, payload: {template_type: string, elements: *}}}}
 */
function buildTemplateResponse(templateType, list, buttons) {

    let listTemplate = {
        "attachment": {
	  "type": "template",
	  "payload": {
	      "template_type": templateType,
	      "elements": list
	  }
        }
    };

    if (buttons) {
        listTemplate.attachment.payload.buttons = buttons;
    }

    return listTemplate;
}

/**
 * handle server response
 * @param resolve
 * @param reject
 * @param data
 */
function handleServerResponse(resolve, reject, data) {
    data = data.getBody();

    let result = data.result;

    if (data.responseType == "SUCCESS") {

        resolve(result);
    } else {

        reject(data.responseType);
    }
}

module.exports = BookerplusLogic;
