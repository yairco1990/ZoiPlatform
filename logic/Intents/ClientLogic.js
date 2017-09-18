/**
 * Created by Yair on 6/20/2017.
 */

const MyLog = require('../../interfaces/MyLog');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment-timezone');
const facebookResponse = require('../../interfaces/FacebookResponse');
const MindbodyLogic = require('../ApiHandlers/MindbodyLogic');
const EmailLib = require('../../interfaces/EmailLib');
const EmailConfig = require('../../interfaces/assets/EmailsConfig');
const AcuityLogic = require('../ApiHandlers/AcuitySchedulingLogic');
const _ = require('underscore');
const async = require('async');
const ZoiConfig = require('../../config');
const deepcopy = require('deepcopy');
const ConversationLogic = require('../ConversationLogic');

const delayTime = ZoiConfig.delayTime;

//QUESTIONS
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

const promoteOldCustomersQuestions = {
	toPromote: {
		id: 1,
		text: "What do you say?"
	}
};

class ClientLogic extends ConversationLogic {

	constructor(user, conversationData) {
		super(user, conversationData);
	}

	/**
	 * process the user input
	 */
	async processIntent() {

		const {conversationData, reply} = this;

		switch (conversationData.intent) {
			case "client new customer join":
				await this.newCustomerJoin(conversationData, reply);
				break;
			case "client old customers":
				this.botTyping();
				await this.promoteOldCustomers(conversationData, reply);
				break;
		}
	};

	/**
	 * customer scheduled for the first time
	 * @param conversationData
	 * @param reply
	 */
	async newCustomerJoin(conversationData, reply) {

		const self = this;
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

				if (conversationData.payload.id === 1) {

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
						emailHtml = emailHtml.replace('{{preHeaderText}}', "Welcome to " + user.integrations.Acuity.userDetails.name);

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
			MyLog.error("Error on new customer joined. userId => " + user._id);
		}
	};

	/**
	 * promote old customers - customer that didn't schedule for a long time
	 * @param conversationData
	 * @param reply
	 * @returns {Promise.<void>}
	 */
	async promoteOldCustomers(conversationData, reply) {

		const self = this;
		const user = self.user;

		try {
			const lastQuestionId = user.conversationData && user.conversationData.lastQuestion ? user.conversationData.lastQuestion.id : null;
			const acuityLogic = new AcuityLogic(user.integrations.Acuity.accessToken);

			//if this is the start of the conversation
			if (!user.conversationData) {
				//current question
				const currentQuestion = promoteOldCustomersQuestions.shouldZoiPromote;
				//save conversation to the user
				user.conversationData = conversationData;
				//save the question
				user.conversationData.lastQuestion = currentQuestion;

				//user selected range
				const daysRange = user.oldCustomersRange && user.oldCustomersRange.value ? user.oldCustomersRange.value : ZoiConfig.times.oldCustomersPreviousDays;

				//search old customers
				const appointments = await acuityLogic.getAppointments({
					max: 10000,//maximum number of results
					minDate: MyUtils.convertToAcuityDate(moment().tz(user.integrations.Acuity.userDetails.timezone).subtract(daysRange, 'days').startOf('day')),
					maxDate: MyUtils.convertToAcuityDate(moment().tz(user.integrations.Acuity.userDetails.timezone).add(ZoiConfig.times.oldCustomersForwardDays, 'days').endOf('day'))
				});

				//window checking
				const windowStartDate = moment().tz(user.integrations.Acuity.userDetails.timezone).subtract(daysRange, 'days').startOf('day');
				const windowEndDate = moment().tz(user.integrations.Acuity.userDetails.timezone).subtract(daysRange, 'days').endOf('day');

				const windowAppointments = [];
				const nonWindowAppointments = [];

				//iterate all the appointments
				appointments.forEach(function (appointment) {
					//if the appointment is in the window
					if (moment(appointment.datetime).tz(user.integrations.Acuity.userDetails.timezone).isAfter(windowStartDate)
						&& moment(appointment.datetime).tz(user.integrations.Acuity.userDetails.timezone).isBefore(windowEndDate)) {
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
				const lastQRResponse = facebookResponse.getQRElement(currentQuestion.text,
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

					//default text
					let replyText = "I didn't find relevant customers for the promotion. Try again tomorrow and I will check again.";

					//if the old customers scenario ran on automated mode
					if (conversationData.automated) {
						replyText = self.getStatsMessage();
					}

					reply(facebookResponse.getTextMessage(replyText), false, delayTime);
					self.clearConversation();
				}
			}
			else if (lastQuestionId === promoteOldCustomersQuestions.shouldZoiPromote.id) {

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
					await self.DBManager.saveUser(user);

					//send messages
					async.series([
						MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Good!"), true),
						MyUtils.resolveMessage(reply, facebookResponse.getButtonMessage("Let's pick some non-regulars and encourage them to come back", [
							facebookResponse.getGenericButton("web_url", "Non-regulars", null, ZoiConfig.clientUrl + "/old-customers?userId=" + user._id, "tall")
						]), false, delayTime),
					], MyUtils.getErrorMsg());

					self.clearConversation();

				} else if (conversationData.payload.id === 2) {
					reply(facebookResponse.getTextMessage("I will be here if you need me :)"));
					self.clearConversation();
				}
			}
		} catch (err) {
			MyLog.error(err);
			MyLog.error("Error on old customers scenario. userId => " + user._id);
		}
	};

}

module.exports = ClientLogic;