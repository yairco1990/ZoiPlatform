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

const delayTime = 3000;

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
		text: "Do you want to send welcome email to this customer?"
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
		//ask send email
		let currentQuestion = newCustomerJoinQuestions.sendEmail;

		//save conversation to the user
		user.conversationData = conversationData;
		//save the question
		user.conversationData.lastQuestion = currentQuestion;
		//save the user
		self.DBManager.saveUser(user).then(function () {

			callback(facebookResponse.getTextMessage("Hey boss, New customer scheduled just now."), true);

			setTimeout(function () {
				callback(facebookResponse.getQRElement(currentQuestion.text,
					[facebookResponse.getQRButton("text", "Yes, send it.", {id: 1}),
						facebookResponse.getQRButton("text", "No, don't send it.", {id: 2})]
				))
			}, delayTime);
		});
	}
	else if (user.conversationData.lastQuestion.id === newCustomerJoinQuestions.sendEmail.id) {

		if (conversationData.payload.id == 1) {

			callback(facebookResponse.getTextMessage("Let's send it!"), true);

			//ask which tenplate
			let currentQuestion = newCustomerJoinQuestions.whichTemplate;
			//save conversation to the user
			user.conversationData = conversationData;
			//save the question
			user.conversationData.lastQuestion = currentQuestion;

			//save the user
			self.DBManager.saveUser(user).then(function () {
				setTimeout(function () {
					callback(facebookResponse.getTextMessage(currentQuestion.text), true);

					setTimeout(function () {
						callback(facebookResponse.getGenericTemplate([
							facebookResponse.getGenericElement("Welcome Email",
								"https://www.askideas.com/media/13/Welcome-3d-Picture.jpg",
								"Welcome my friend!",
								[facebookResponse.getGenericButton("postback", "I like it", {
									id: 1,
									title: "Welcome to our spa!"
								})]),
							facebookResponse.getGenericElement("Good Choice!",
								"http://www.designsbykayla.net/wp-content/uploads/2016/03/Welcome_large.jpg",
								"You did the right thing!",
								[facebookResponse.getGenericButton("postback", "I like it", {
									id: 2,
									title: "Hope you will enjoy our services!"
								})])
						]));
					}, delayTime);
				}, delayTime);
			});
		} else {
			user.conversationData = null;
			user.session = null;

			//save the user
			self.DBManager.saveUser(user).then(function () {
				callback(facebookResponse.getTextMessage("Ok boss.."));
			});
		}
	} else if (user.conversationData.lastQuestion.id === newCustomerJoinQuestions.whichTemplate.id) {

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

		callback(facebookResponse.getTextMessage("Great! I sent it to him. 😎"), true);

		setTimeout(function () {
			callback(facebookResponse.getTextMessage("I'm sure he will be happy to see your attitude! ☺"));
		}, delayTime);

		//clear conversation data
		user.conversationData = null;
		user.session = null;
		//save the user
		self.DBManager.saveUser(user).then(function () {
		}).catch(MyUtils.getErrorMsg);
	}
};


const promoteOldCustomersQuestions = {
	toPromote: {
		id: 1,
		text: "Do you want me to send promotions to old customer?"
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

			//save the user
			self.DBManager.saveUser(user).then(function () {

				callback(facebookResponse.getTextMessage("Hey boss. You have " + oldCustomers.length + " customers that I didn't see for a long time..."), true);

				setTimeout(function () {
					callback(facebookResponse.getQRElement(currentQuestion.text,
						[facebookResponse.getQRButton("text", "Yes, send it.", {id: 1}),
							facebookResponse.getQRButton("text", "No, don't send it.", {id: 2})]
					))
				}, delayTime);

			}).catch(MyUtils.getErrorMsg(function () {
				self.clearSession();
			}));

		}).catch(MyUtils.getErrorMsg(function () {
			self.clearSession();
		}));
	}
	else if (lastQuestionId === promoteOldCustomersQuestions.toPromote.id) {

		if (conversationData.payload.id == 1) {
			user.conversationData = null;
			//save the old customers to metadata
			if (!user.metadata) {
				user.metadata = {};
			}
			user.metadata.oldCustomers = user.session.oldCustomers;

			//save the user
			self.DBManager.saveUser(user).then(function () {
				callback(facebookResponse.getTextMessage("Good!"), true);

				setTimeout(function () {

					callback(facebookResponse.getButtonMessage("Click here and choose who do you like to promote:", [
						facebookResponse.getGenericButton("web_url", "Old Customers", null, ZoiConfig.clientUrl + "/old-customers?userId=" + user._id, "full")
					]));

					self.clearSession();

				}, delayTime);
			});
		} else if (conversationData.payload.id == 2) {
			callback(facebookResponse.getTextMessage("You said no.."));
			self.clearSession();
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