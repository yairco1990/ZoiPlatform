/**
 * Created by Yair on 6/20/2017.
 */

const Util = require('util');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment');
const facebookResponse = require('../../interfaces/FacebookResponse');
const MindbodyLogic = require('../ApiHandlers/MindbodyLogic');
const EmailLib = require('../../interfaces/EmailLib');
const AcuityLogic = require('../ApiHandlers/AcuitySchedulingLogic');
const _ = require('underscore');
const ZoiConfig = require('../../config');

const delayTime = ZoiConfig.delayTime || 3000;

function ClientLogic(user) {
	this.user = user;
	//get the single instance of DBManager
	this.DBManager = require('../../dal/DBManager');
	this.mindbodyLogic = new MindbodyLogic({});
}

/**
 * process the user input
 */
ClientLogic.prototype.processIntent = function (conversationData, setBotTyping, requestObj, callback) {

	let self = this;

	switch (conversationData.intent) {
		case "client show customer card":
			self.getCustomer(conversationData, callback);
			break;
		case "client new customer join":
			self.newCustomerJoin(conversationData, callback);
			break;
		case "client old customers":
			self.promoteOldCustomers(conversationData, callback);
			break;
	}
};

const newCustomerJoinQuestions = {
	sendEmail: {
		id: 1,
		text: "Do you want me to send this email?"
	},
	whichTemplate: {
		id: 2,
		text: "Which template to use?"
	}
};
ClientLogic.prototype.newCustomerJoin = function (conversationData, callback) {

	let self = this;
	let user = self.user;

	//if this is the start of the conversation
	if (!user.conversationData) {
		//set current question
		let currentQuestion = newCustomerJoinQuestions.sendEmail;
		//save conversation to the user
		user.conversationData = conversationData;
		//save the question
		user.conversationData.lastQuestion = currentQuestion;
		//save qr
		let lastQRResponse = facebookResponse.getQRElement(currentQuestion.text,
			[facebookResponse.getQRButton("text", "Yes, send it.", {id: 1}),
				facebookResponse.getQRButton("text", "No, don't send it.", {id: 2})]
		);
		user.conversationData.lastQRResponse = lastQRResponse;

		//save the user
		self.DBManager.saveUser(user).then(function () {

			callback(facebookResponse.getTextMessage("Hooray! 👏 " + user.session.newClient.firstName + " " + user.session.newClient.lastName + " scheduled an appointment for the first time"), true);

			setTimeout(function () {
				callback(facebookResponse.getTextMessage("Let's send a welcome email"), true);

				setTimeout(function () {
					callback(facebookResponse.getGenericTemplate([
						facebookResponse.getGenericElement("Welcome Email", "http://www.designsbykayla.net/wp-content/uploads/2016/03/Welcome_large.jpg", "", null)
					]), null, function () {
						setTimeout(function () {
							callback(lastQRResponse);
						}, delayTime);
					});
				}, delayTime);
			}, delayTime);
		});
	}
	else if (user.conversationData.lastQuestion.id === newCustomerJoinQuestions.sendEmail.id) {

		if (conversationData.payload) {
			if (conversationData.payload.id == 1) {

				if (user.session && user.session.newClient && user.session.newClient.email) {
					EmailLib.getEmailFile(__dirname + "/../../interfaces/assets/promotionsMail.html").then(function (emailHtml) {
						EmailLib.sendEmail(emailHtml, [{
							address: user.session.newClient.email,
							from: 'Zoi.AI <noreply@fobi.io>',
							subject: 'Test Subject',
							alt: 'Test Alt'
						}]);
					}).catch(MyUtils.getErrorMsg);
				}

				callback(facebookResponse.getTextMessage("Done 😎"), true);
				setTimeout(function () {
					callback(facebookResponse.getTextMessage("Greeting a new customer makes a good first step for retention"), true);
					setTimeout(function () {
						callback(facebookResponse.getTextMessage("I'll be here if you will need anything else"));
					}, delayTime);
				}, delayTime);

				//clear conversation data
				user.conversationData = null;
				user.session = null;
				//save the user
				self.DBManager.saveUser(user).then(function () {
				}).catch(MyUtils.getErrorMsg);

			} else {
				user.conversationData = null;
				user.session = null;

				//save the user
				self.DBManager.saveUser(user).then(function () {
					callback(facebookResponse.getTextMessage("Ok boss.."));
				});
			}
		} else {
			callback(user.conversationData.lastQRResponse);
		}
	}
};


const promoteOldCustomersQuestions = {
	toPromote: {
		id: 1,
		text: "I suggest we send a promotion to non-regular customers"
	}
};
ClientLogic.prototype.promoteOldCustomers = function (conversationData, callback) {

	let self = this;
	let user = self.user;

	let lastQuestionId = user.conversationData && user.conversationData.lastQuestion ? user.conversationData.lastQuestion.id : null;
	let acuityLogic = new AcuityLogic(user.integrations.Acuity.accessToken);

	//if this is the start of the conversation
	if (!user.conversationData) {
		//current question
		let currentQuestion = promoteOldCustomersQuestions.toPromote;
		//save conversation to the user
		user.conversationData = conversationData;
		//save the question
		user.conversationData.lastQuestion = currentQuestion;

		//TODO config it
		let dayRange = 5;

		//search old customers
		acuityLogic.getAppointments({
			minDate: MyUtils.convertToAcuityDate(moment().subtract(dayRange, 'days').startOf('day')),
			maxDate: MyUtils.convertToAcuityDate(moment().add(dayRange, 'days').endOf('day'))
		}).then(function (appointments) {

			//window checking TODO config it
			let windowStartDate = moment().subtract(dayRange, 'days').startOf('day');
			let windowEndDate = moment().subtract(dayRange, 'days').endOf('day');
			let windowAppointments = [];
			let nonWindowAppointments = [];
			//iterate all the appointments
			appointments.forEach(function (appointment) {
				//if the appointment is in the window
				if (moment(appointment.datetime).isAfter(windowStartDate) && moment(appointment.datetime).isBefore(windowEndDate)) {
					windowAppointments.push(appointment);
				} else {
					nonWindowAppointments.push(appointment);
				}
			});

			let oldCustomers = [];
			windowAppointments.forEach(function (windowAppointment) {
				let customer = {
					firstName: windowAppointment.firstName,
					lastName: windowAppointment.lastName,
					email: windowAppointment.email
				};
				let isExist = false;
				nonWindowAppointments.forEach(function (nonWindowAppointment) {
					if (windowAppointment.firstName == nonWindowAppointment.firstName &&
						windowAppointment.lastName == nonWindowAppointment.lastName &&
						windowAppointment.email == nonWindowAppointment.email) {
						//if those equals, it means that this is not a old customer
						isExist = true;
					}
				});
				//if we didn't find the use in the nonWindow appointments, it's an old customer
				if (!isExist) {
					oldCustomers.push(customer);
				}
			});

			//remove duplicates customers
			oldCustomers = _.uniq(oldCustomers, function (customer, key, a) {
				return customer.firstName && customer.lastName;
			});

			return oldCustomers;
		}).then(function (oldCustomers) {

			//save the old customers
			if (!user.session) {
				user.session = {};
			}
			user.session.oldCustomers = oldCustomers;

			//save qr
			let lastQRResponse = facebookResponse.getQRElement(currentQuestion.text,
				[facebookResponse.getQRButton("text", "Yes, send it.", {id: 1}),
					facebookResponse.getQRButton("text", "No, don't send it.", {id: 2})]
			);
			user.conversationData.lastQRResponse = lastQRResponse;

			//save the user
			self.DBManager.saveUser(user).then(function () {

				if (oldCustomers.length) {
					callback(facebookResponse.getTextMessage("Hey boss, I noticed that there are " + oldCustomers.length + " non-regular customers. These are customers that didn't visit for a while."), true);
					setTimeout(function () {
						callback(facebookResponse.getTextMessage("Let's send a welcome email"), true);

						setTimeout(function () {
							callback(facebookResponse.getGenericTemplate([
								facebookResponse.getGenericElement("Welcome Email", "http://www.designsbykayla.net/wp-content/uploads/2016/03/Welcome_large.jpg", "", null)
							]), true, function () {
								setTimeout(function () {
									callback(lastQRResponse);
								}, delayTime);
							});
						}, delayTime);
					}, delayTime);
				} else {
					callback(facebookResponse.getTextMessage("There are no old customers to show today."));
					self.clearSession();
				}

			})
		}).catch(MyUtils.getErrorMsg(function () {
			self.clearSession();
		}));
	}
	else if (lastQuestionId === promoteOldCustomersQuestions.toPromote.id) {

		if (conversationData.payload) {
			if (conversationData.payload.id == 1) {
				user.conversationData = null;
				//save the old customers to metadata
				user.metadata.oldCustomers = user.session.oldCustomers;

				//save the user
				self.DBManager.saveUser(user).then(function () {

					callback(facebookResponse.getTextMessage("Good!"), true);

					setTimeout(function () {

						callback(facebookResponse.getButtonMessage("Let's pick some non-regulars and try to make them come back", [
							facebookResponse.getGenericButton("web_url", "Non-regulars", null, ZoiConfig.clientUrl + "/old-customers?userId=" + user._id, "full")
						]));

						//TODO after he sent the emails, send him message about - "WOOHOO! We will turn these non-regulars to big fans in no time!"
						self.clearSession();

					}, delayTime);
				});
			} else if (conversationData.payload.id == 2) {
				callback(facebookResponse.getTextMessage("I will be here if you need me :)"));
				self.clearSession();
			}
		} else {
			callback(user.conversationData.lastQRResponse);
		}
	}
};

/**
 * get customer
 */
ClientLogic.prototype.getCustomer = function (entities, callback) {

	let self = this;

	self.mindbodyLogic.getClients(entities).then(function (clients) {

		//choose the first one we found
		let customer = clients[0];

		callback(facebookResponse.getGenericTemplate([
			facebookResponse.getGenericElement(customer.FirstName + " " + customer.LastName, customer.PhotoURL, "Status: " + customer.Status)
		]));

	}).catch(function (err) {

		Util.log(err);
		callback(facebookResponse.getTextMessage("Error on getting clients"));
	});
};

/**
 * clear user session
 */
ClientLogic.prototype.clearSession = function () {
	let self = this;
	let user = self.user;

	//clear conversation data
	user.conversationData = null;
	user.session = null;
	self.DBManager.saveUser(user).then(function () {
		Util.log("conversation cleared!");
	});
};

module.exports = ClientLogic;