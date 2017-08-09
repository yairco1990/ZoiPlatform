/**
 * Created by Yair on 6/20/2017.
 */

const Util = require('util');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment');
const facebookResponse = require('../../interfaces/FacebookResponse');
const MindbodyLogic = require('../ApiHandlers/MindbodyLogic');
const EmailLib = require('../../interfaces/EmailLib');
const EmailConfig = require('../../interfaces/assets/EmailsConfig');
const AcuityLogic = require('../ApiHandlers/AcuitySchedulingLogic');
const _ = require('underscore');
const async = require('async');
const ZoiConfig = require('../../config');
const deepcopy = require('deepcopy');

const delayTime = ZoiConfig.delayTime || 3000;

function ClientLogic(user) {
	this.user = user;
	//get the single instance of DBManager
	this.DBManager = require('../../dal/DBManager');
}

/**
 * process the user input
 */
ClientLogic.prototype.processIntent = function (conversationData, setBotTyping, requestObj, reply) {

	let self = this;

	switch (conversationData.intent) {
		case "client new customer join":
			self.newCustomerJoin(conversationData, reply);
			break;
		case "client old customers":
			self.promoteOldCustomers(conversationData, reply);
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
ClientLogic.prototype.newCustomerJoin = async function (conversationData, reply) {

	let self = this;
	let user = self.user;

	try {
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
			await self.DBManager.saveUser(user);

			//send messages
			async.series([
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Hooray! 👏 " + user.session.newClient.firstName + " " + user.session.newClient.lastName + " scheduled an appointment for the first time"), true),
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Let's send a welcome email"), true, delayTime),
				MyUtils.resolveMessage(reply, facebookResponse.getGenericTemplate([
					facebookResponse.getGenericElement("Welcome Email", EmailConfig.newCustomerEmail.bannerImage, "Send a friendly welcome email to your customer", null)
				]), true, delayTime),
				MyUtils.resolveMessage(reply, lastQRResponse, false, delayTime),
			], MyUtils.getErrorMsg());
		}
		else if (user.conversationData.lastQuestion.id === newCustomerJoinQuestions.sendEmail.id) {

			//verify that this is payload
			if (!conversationData.payload) {
				//send qr again
				async.series([
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Let's finish what we started"), true),
					MyUtils.resolveMessage(reply, user.conversationData.lastQRResponse, false, delayTime),
				], MyUtils.getErrorMsg());
				return;
			}

			if (conversationData.payload.id == 1) {

				if (user.session && user.session.newClient && user.session.newClient.email) {

					let newCustomerEmail = user.session.newClient.email;
					let firstName = user.session.newClient.firstName;
					let emailTemplate = EmailConfig.newCustomerEmail;

					let emailHtml = EmailLib.getEmailByName('promotionsMail');

					//parse the first part
					emailHtml = emailHtml.replace('{{line1}}', emailTemplate.line1);
					emailHtml = emailHtml.replace('{{line2}}', emailTemplate.line2);
					emailHtml = emailHtml.replace('{{line3}}', emailTemplate.line3);
					emailHtml = emailHtml.replace('{{line4}}', emailTemplate.line4);
					emailHtml = emailHtml.replace('{{bannerSrc}}', emailTemplate.bannerImage);

					//parse the second part
					emailHtml = MyUtils.replaceAll('{{business name}}', user.integrations.Acuity.userDetails.name, emailHtml);
					emailHtml = MyUtils.replaceAll('{{firstName}}', firstName, emailHtml);
					emailHtml = MyUtils.replaceAll('{{hoverColor}}', emailTemplate.hoverColor, emailHtml);
					emailHtml = MyUtils.replaceAll('{{color}}', emailTemplate.color, emailHtml);
					emailHtml = MyUtils.replaceAll('{{href}}', user.integrations.Acuity.userDetails.schedulingPage, emailHtml);
					emailHtml = MyUtils.replaceAll('{{buttonText}}', EmailConfig.newCustomerEmail.buttonText, emailHtml);
					emailHtml = MyUtils.replaceAll('{{unsubscribeHref}}', ZoiConfig.serverUrl + "/unsubscribe?email=" + newCustomerEmail, emailHtml);

					//parse subject
					let newCustomerSubject = EmailConfig.newCustomerEmail.subject;
					newCustomerSubject = MyUtils.replaceAll('{{business name}}', user.integrations.Acuity.userDetails.name, newCustomerSubject);

					EmailLib.sendEmail(emailHtml, [{
						address: newCustomerEmail,
						from: user.integrations.Acuity.userDetails.name + ' <noreply@zoi.ai>',
						subject: newCustomerSubject,
						alt: 'New Customer Joined',
						replyTo: user.integrations.Acuity.userDetails.email
					}]);
				}

				//send messages
				async.series([
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Done 😎"), true),
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Greeting a new customer makes a good first step for retention"), true, delayTime),
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("I'll be here if you will need anything else"), false, delayTime),
				], MyUtils.getErrorMsg());

				//clear conversation data
				user.conversationData = null;
				user.session = null;
				//save the user
				self.DBManager.saveUser(user);

			} else {
				user.conversationData = null;
				user.session = null;

				//save the user
				self.DBManager.saveUser(user).then(function () {
					reply(facebookResponse.getTextMessage("Ok boss!"));
				});
			}
		}
	} catch (err) {
		Util.log("Error on new customer joined. userId => " + user._id);
	}
};


const promoteOldCustomersQuestions = {
	toPromote: {
		id: 1,
		text: "What do you say?"
	}
};
ClientLogic.prototype.promoteOldCustomers = async function (conversationData, reply) {

	let self = this;
	let user = self.user;

	try {
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

			//user selected range
			let daysRange = user.oldCustomersRange && user.oldCustomersRange.value ? user.oldCustomersRange.value : 30;

			//search old customers
			let appointments = await acuityLogic.getAppointments({
				minDate: MyUtils.convertToAcuityDate(moment().subtract(daysRange, 'days').startOf('day')),
				maxDate: MyUtils.convertToAcuityDate(moment().add(30, 'days').endOf('day'))
			});

			//window checking TODO config it
			let windowStartDate = moment().subtract(daysRange, 'days').startOf('day');
			let windowEndDate = moment().subtract(daysRange, 'days').endOf('day');

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
					if (windowAppointment.firstName === nonWindowAppointment.firstName &&
						windowAppointment.lastName === nonWindowAppointment.lastName &&
						windowAppointment.email === nonWindowAppointment.email) {
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
			await self.DBManager.saveUser(user);

			if (oldCustomers.length) {
				//send messages
				async.series([
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Hey boss, I noticed that there are " + oldCustomers.length + " non-regular customers. These are customers that didn't visit for a while."), true),
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Let's send a promotion email"), true, delayTime),
					MyUtils.resolveMessage(reply, facebookResponse.getGenericTemplate([
						facebookResponse.getGenericElement("10% Off", EmailConfig.oldCustomersEmail.bannerImage, "Send non-regular customers a promotion with 10% discount", null)
					]), true),
					MyUtils.resolveMessage(reply, lastQRResponse, false, delayTime),
				], MyUtils.getErrorMsg());
			} else {
				//decide on text depends if the user made the request or it made by the system interval
				let replyText = !conversationData.automated ? "I didn't find relevant customers for the promotion. Try again tomorrow and I will check again." : "There are no non-regulars to preview today :)";
				reply(facebookResponse.getTextMessage(replyText), false, delayTime);
				self.clearSession();
			}
		}
		else if (lastQuestionId === promoteOldCustomersQuestions.toPromote.id) {

			if (!conversationData.payload) {
				//send qr again
				async.series([
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Let's finish what we started"), true),
					MyUtils.resolveMessage(reply, user.conversationData.lastQRResponse, false, delayTime),
				], MyUtils.getErrorMsg());
				return;
			}

			if (conversationData.payload.id === 1) {
				user.conversationData = null;
				//save the old customers to metadata
				user.metadata.oldCustomers = user.session.oldCustomers;

				//save the user
				await self.DBManager.saveUser(user)

				//send messages
				async.series([
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Good!"), true),
					MyUtils.resolveMessage(reply, facebookResponse.getButtonMessage("Let's pick some non-regulars and encourage them to come back", [
						facebookResponse.getGenericButton("web_url", "Non-regulars", null, ZoiConfig.clientUrl + "/old-customers?userId=" + user._id, "full")
					]), false, delayTime),
				], MyUtils.getErrorMsg());

				self.clearSession();

			} else if (conversationData.payload.id === 2) {
				reply(facebookResponse.getTextMessage("I will be here if you need me :)"));
				self.clearSession();
			}
		}
	} catch (err) {
		Util.log(err);
		Util.log("Error on old customers scenario. userId => " + user._id);
	}
};

/**
 * get customer
 */
// ClientLogic.prototype.getCustomer = function (entities, reply) {
//
// 	let self = this;
//
// 	self.mindbodyLogic.getClients(entities).then(function (clients) {
//
// 		//choose the first one we found
// 		let customer = clients[0];
//
// 		reply(facebookResponse.getGenericTemplate([
// 			facebookResponse.getGenericElement(customer.FirstName + " " + customer.LastName, customer.PhotoURL, "Status: " + customer.Status)
// 		]));
//
// 	}).catch(function (err) {
//
// 		Util.log(err);
// 		reply(facebookResponse.getTextMessage("Error on getting clients"));
// 	});
// };

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