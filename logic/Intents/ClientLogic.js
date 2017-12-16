/**
 * Created by Yair on 6/20/2017.
 */

const MyLog = require('../../interfaces/MyLog');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment-timezone');
const facebookResponse = require('../../interfaces/FacebookResponse');
const EmailLib = require('../../interfaces/EmailLib');
const EmailConfig = require('../../interfaces/assets/EmailsConfig');
const AcuityLogic = require('../ApiHandlers/AcuitySchedulingLogic');
const _ = require('underscore');
const async = require('async');
const ZoiConfig = require('../../config');
const deepcopy = require('deepcopy');
const ConversationLogic = require('../ConversationLogic');

const delayTime = ZoiConfig.delayTime;

class ClientLogic extends ConversationLogic {

	constructor(user, conversationData) {
		super(user, conversationData);
	}

	/**
	 * process the user input
	 */
	async processIntent() {

		const {conversationData} = this;

		switch (conversationData.intent) {
			case "client new customer join":
				await this.newCustomerJoinConvoManager();
				break;
			case "client old customers":
				this.botTyping();
				await this.oldCustomersConvoManager();
				break;
		}
	};

	/**
	 * customer scheduled for the first time
	 */
	async newCustomerJoinConvoManager() {

		const {user} = this;

		try {

			//get the next state he wants to go
			const nextState = this.getNextState();

			//if this is the start of the conversation
			if (!user.conversationData) {
				await this.suggestWelcomeEmail();
			} else if (nextState === "sendWelcomeEmail") {
				await this.sendWelcomeEmail();
			} else if (nextState === "stopConvo") {
				await this.stopConvo();
			}
		} catch (err) {
			MyLog.error("Error on new customer joined. userId => " + user._id);
		}
	};

	/**
	 * suggest welcome email to new customer
	 * @returns {Promise.<void>}
	 */
	async suggestWelcomeEmail() {

		const {user} = this;

		this.setNextAnswerState("qr");

		//save qr
		let lastQRResponse = this.setLastQRResponse(facebookResponse.getQRElement("Do you want me to send this email?", [
			facebookResponse.getQRButton("text", "Yes, send it.", {nextState: "sendWelcomeEmail"}),
			facebookResponse.getQRButton("text", "No, don't send it.", {nextState: "stopConvo"})]
		));

		//send messages
		await this.sendMessagesV2([
			[facebookResponse.getTextMessage("Hooray! 👏 " + user.session.newClient.firstName + " " + user.session.newClient.lastName + " scheduled an appointment for the first time")],
			[facebookResponse.getTextMessage("Let's send a welcome email")],
			[facebookResponse.getGenericTemplate([
				facebookResponse.getGenericElement("Welcome Email", EmailConfig.newCustomerEmail.bannerImage, "Send a friendly welcome email to your customer", null)
			])],
			[lastQRResponse]
		]);
	}

	/**
	 * send welcome email
	 * @returns {Promise.<void>}
	 */
	async sendWelcomeEmail() {

		const {user} = this;

		//check that email exist
		if (MyUtils.nestedValue(user, "session.newClient.email")) {

			const newCustomerEmail = user.session.newClient.email;
			const firstName = user.session.newClient.firstName;
			const emailTemplate = EmailConfig.newCustomerEmail;

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

		//clear convo data
		await this.clearConversation(false);

		//send messages
		await this.sendMessagesV2([
			[facebookResponse.getTextMessage("Done 😎")],
			[facebookResponse.getTextMessage("Greeting a new customer makes a good first step for retention")],
			[facebookResponse.getTextMessage("I'll be here if you will need anything else")]
		]);
	}

	/**
	 * promote old customers - customer that didn't schedule for a long time
	 * @returns {Promise.<void>}
	 */
	async oldCustomersConvoManager() {

		const {user} = this;

		try {
			const nextState = this.getNextState();

			//if this is the start of the conversation
			if (!user.conversationData) {
				await this.lookForOldCustomers();
			} else if (nextState === "sendEmails") {
				await this.sendEmailsToOldCustomers();
			} else if (nextState === "stopConvo") {
				await this.stopConvo();
			}
		} catch (err) {
			MyLog.error(err);
			MyLog.error("Error on old customers scenario. userId => " + user._id);
		}
	};

	/**
	 * look for old customers
	 * @returns {Promise.<void>}
	 */
	async lookForOldCustomers() {

		const {user, acuityLogic, conversationData} = this;

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

		this.setNextAnswerState("qr");
		//save qr
		const lastQRResponse = this.setLastQRResponse(facebookResponse.getQRElement("What do you say?", [
			facebookResponse.getQRButton("text", "Yes, send it.", {nextState: "sendEmails"}),
			facebookResponse.getQRButton("text", "No, don't send it.", {nextState: "stopConvo"})
		]));

		//if found old customers
		if (oldCustomers.length) {
			//send messages
			await this.sendMessagesV2([
				[facebookResponse.getTextMessage("Hey boss, I noticed that there are " + oldCustomers.length + " non-regular customers. These are customers that didn't visit for a while.")],
				[facebookResponse.getTextMessage("Let's send a promotion email")],
				[facebookResponse.getGenericTemplate([
					facebookResponse.getGenericElement("10% Off", EmailConfig.oldCustomersEmail.bannerImage, "Send non-regular customers a promotion with 10% discount", null)
				])],
				[lastQRResponse]
			]);
		} else {

			//default text
			let replyText = "I didn't find relevant customers for the promotion. Try again tomorrow and I will check again.";

			//if the old customers scenario ran on automated mode
			if (conversationData.automated) {
				replyText = this.getStatsMessage();
			}

			await this.clearConversation(false);
			await this.sendSingleMessage(replyText);
		}
	}

	/**
	 * send emails to old customers - show a button that opens webview to select the old customers to send them
	 * @returns {Promise.<void>}
	 */
	async sendEmailsToOldCustomers() {

		const {user} = this;

		//save the old customers to metadata
		user.metadata.oldCustomers = user.session.oldCustomers;

		await this.clearConversation(false);

		//send messages
		await this.sendMessagesV2([
			[facebookResponse.getTextMessage("Good!")],
			[facebookResponse.getButtonMessage("Let's pick some non-regulars and encourage them to come back", [
				facebookResponse.getGenericButton("web_url", "Non-regulars", null, ZoiConfig.clientUrl + "/old-customers?userId=" + user._id, "tall")
			])],
		]);
	}
}

module.exports = ClientLogic;