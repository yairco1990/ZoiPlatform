/**
 * Created by Yair on 6/20/2017.
 */
const MyLog = require('../../interfaces/MyLog');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment-timezone');
const facebookResponse = require('../../interfaces/FacebookResponse');
const MindbodyLogic = require('../ApiHandlers/MindbodyLogic');
const MindbodyFactory = require('../../interfaces/Factories/MindbodyFactory');
const EmailLib = require('../../interfaces/EmailLib');
const ZoiConfig = require('../../config');
const deepcopy = require('deepcopy');
const EmailConfig = require('../../interfaces/assets/EmailsConfig');
const async = require('async');
const _ = require('underscore');
const ConversationLogic = require('../ConversationLogic');

const delayTime = ZoiConfig.delayTime;

//QUESTIONS
const sendPromotionsQuestions = {
	toPromote: {
		id: 0
	},
	serviceName: {
		id: 1,
		text: "Which service would you like to promote?",
		field: "service"
	},
	whichTemplate: {
		id: 2,
		text: "I made five types of discount for you to choose from.  Which of them you want me to send to your customers?",
		field: "template"
	},
	areYouSure: {
		id: 3,
		text: "Just to be clear, I am about to send {promotionName} promotion for {serviceName} to your customers?"
	}
};


class AppointmentLogic extends ConversationLogic {

	constructor(user, conversationData) {
		super(user, conversationData);
	}

	/**
	 * process the user input
	 */
	async processIntent() {
		const self = this;

		switch (self.conversationData.intent) {
			case "appointment what is my schedule":
				await self.getAppointments();
				break;
			case "appointment show my schedule":
				await self.getAppointments();
				break;
			case "appointment send promotions":
				await self.startPromotionsConvo();
				break;
		}
	};

	/**
	 * get appointments
	 */
	async getAppointments() {
		const self = this;
		const {user} = self;
		const {reply} = self;

		try {
			await self.sendMessages([
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Let me see..."), true),
				MyUtils.resolveMessage(reply, facebookResponse.getButtonMessage("Here is your schedule for today boss:", [
					facebookResponse.getGenericButton("web_url", "Agenda", null, ZoiConfig.clientUrl + "/agenda?userId=" + user._id, "full")
				]), true, delayTime),
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Anything else?"), false, delayTime)
			]);

			return MyUtils.SUCCESS;
		} catch (err) {
			MyLog.error("Failed to get appointments", err);
			return MyUtils.ERROR;
		}
	};


	/**
	 * send promotions
	 */
	async startPromotionsConvo() {
		const self = this;
		const {user} = self;

		try {
			const lastQuestionId = user.conversationData && user.conversationData.lastQuestion ? user.conversationData.lastQuestion.id : null;

			//if this is the start of the conversation
			if (!user.conversationData) {
				await this.askForPromotion();
			}
			else if (lastQuestionId === sendPromotionsQuestions.toPromote.id) {
				await this.askForService();
			}
			else if (lastQuestionId === sendPromotionsQuestions.serviceName.id) {
				await this.askForTemplate();
			}
			else if (lastQuestionId === sendPromotionsQuestions.whichTemplate.id) {
				await this.askForPromotionConfirmation();
			}
			else if (lastQuestionId === sendPromotionsQuestions.areYouSure.id) {
				await this.sendPromotionToUsers();
			}
			return MyUtils.SUCCESS;
		} catch (err) {
			MyLog.error(err);
			MyLog.error("Error on send promotions. userId => " + user._id);
			await self.clearConversation();
			return MyUtils.ERROR;
		}
	}

	/**
	 * ask the user if he want to promote openings
	 */
	async askForPromotion() {
		const self = this;
		const {user, reply, conversationData} = self;

		//set current question
		self.setCurrentQuestion(sendPromotionsQuestions.toPromote);

		//get services
		const appointmentTypes = await self.acuityLogic.getAppointmentTypes();

		const options = {
			appointmentTypeID: appointmentTypes[0].id,
			date: moment().tz(user.timezone).add(1, 'days').format('YYYY-MM-DDTHH:mm:ss')
		};

		//get slots
		const slots = await self.acuityLogic.getAvailability(options);

		//if there are open slots
		if (slots.length) {
			//save the response
			const lastQRResponse = self.setLastQRResponse(facebookResponse.getQRElement("Do you want me to promote your openings?",
				[
					facebookResponse.getQRButton('text', 'Email Promotion', {id: 1}),
					facebookResponse.getQRButton('text', 'Maybe later', {id: 2})
				]
			));

			//save the user
			await self.DBManager.saveUser(user);

			let firstText = ` noticed that you have ${slots.length} openings on your calendars tomorrow`;
			let secondText = "I can help you fill the openings by promoting to your customers";
			if (slots.length > 10) {
				firstText = " noticed that you have more than 10 openings on your calendars tomorrow";
			}
			if (conversationData.skipHey) {
				firstText = "I also" + firstText;
			} else if (conversationData.firstPromotion) {
				//replace the order
				secondText = "I" + firstText;
				firstText = "Hey boss, we are going to launch our first promotion together! *Excited* ☺";
			} else {
				firstText = "Hey boss, I" + firstText + ".";
			}

			await self.sendMessages([
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage(firstText), true),
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage(secondText), true, delayTime),
				MyUtils.resolveMessage(reply, lastQRResponse, false, delayTime),
			]);

			return "ThereAreOpenSlots";
		}
		//if there aren't open slots
		else {
			await self.clearConversation();

			await self.sendMessages([
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("You don't have openings tomorrow, that's great!"), false, delayTime),
			]);

			if (!user.isOnBoarded) {
				await self.checkAndFinishOnBoarding(true);

				return "ThereAreNoOpenSlots - userNotOnBoarded";
			}

			return "ThereAreNoOpenSlots - userOnBoarded";
		}
	}

	/**
	 * ask for service name
	 */
	async askForService() {

		const self = this;
		const {user, reply, conversationData} = self;

		if (conversationData.payload) {

			//if the user said he wants to send promotion
			if (conversationData.payload.id === 1) {

				//ask which service
				const question = self.setCurrentQuestion(sendPromotionsQuestions.serviceName, "text");

				//get the service list
				let appointmentTypes = await self.acuityLogic.getAppointmentTypes();

				//facebook allow maximum 11 qr buttons
				const appointmentTypesArray = MyUtils.getRandomFromArray(appointmentTypes, 11);

				//create array of qr with the services
				const servicesInQrButtons = appointmentTypesArray.map((service) => {
					return facebookResponse.getQRButton("text", service.name, service);
				});

				//save last qr
				const lastQRResponse = self.setLastQRResponse(facebookResponse.getQRElement(question.text, servicesInQrButtons));

				//save the user
				await self.DBManager.saveUser(user);

				//send messages
				await self.sendMessages([
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Great! 😊"), true),
					MyUtils.resolveMessage(reply, lastQRResponse, false, delayTime),
				]);

				return "userGotServicesList";
			}
			//if the user wants to quit
			else {

				if (!user.isOnBoarded) {
					await self.checkAndFinishOnBoarding(false);

					return "userQuitPromotionProcess - finishOnBoarding";
				} else {
					user.conversationData = null;
					user.session = null;

					//save the user
					await self.DBManager.saveUser(user);

					//send messages
					await self.sendMessages([
						MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("I'll be right here if you need me ☺"), false)
					]);

					return "userQuitPromotionProcess";
				}
			}
		}
		//send qr again
		else {
			await self.sendMessages([
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Let's finish what we started"), true),
				MyUtils.resolveMessage(reply, user.conversationData.lastQRResponse, false, delayTime),
			]);

			return "sendPromotionsQuestionAgain";
		}
	}

	/**
	 * ask for template for promotion
	 */
	async askForTemplate() {

		const self = this;
		const {user, reply, conversationData} = self;

		if (conversationData.payload) {

			//init the session
			user.session = {};

			//get the service by the user input
			user.session[user.conversationData.lastQuestion.field] = conversationData.payload;

			//set current question
			const question = self.setCurrentQuestion(sendPromotionsQuestions.whichTemplate, "payload");

			//save the user
			await self.DBManager.saveUser(user);

			//send messages
			await self.sendMessages([
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage(question.text), true),
				//get coupons
				MyUtils.resolveMessage(reply, AppointmentLogic.getCoupons(), false, delayTime),
			]);

			return "userGotTemplateList";
		} else {
			//send qr again
			await self.sendMessages([
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Let's finish what we started"), true),
				MyUtils.resolveMessage(reply, user.conversationData.lastQRResponse, false, delayTime),
			]);

			return "sendServicesAgain";
		}
	}

	/**
	 * ask from the owner to confirm the promotion
	 */
	async askForPromotionConfirmation() {
		const self = this;
		const {user, reply, conversationData} = self;

		//check valid answer
		if (MyUtils.isJson(conversationData.input)) {

			//get the template
			const template = JSON.parse(conversationData.input);
			user.session[user.conversationData.lastQuestion.field] = template;

			//ask if he is sure
			const currentQuestion = sendPromotionsQuestions.areYouSure;
			let responseText = currentQuestion.text;

			//parse the question text
			responseText = responseText.replace('{serviceName}', user.session['service'].name);
			responseText = responseText.replace('{promotionName}', template.title);

			//save last qr
			user.conversationData.lastQRResponse = facebookResponse.getQRElement(responseText, [
				facebookResponse.getQRButton("text", "Yes, send it.", {answer: "yes"}),
				facebookResponse.getQRButton("text", "No, don't send it.", {answer: "no"})
			]);

			//set current question
			user.conversationData.lastQuestion = currentQuestion;

			//save the user
			await self.DBManager.saveUser(user);

			//send messages
			await self.sendMessages([
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Great! 😊"), true),
				MyUtils.resolveMessage(reply, user.conversationData.lastQRResponse, false, delayTime),
			]);

			return "userGotConfirmationMessage";
		} else {
			//case he was typing
			await self.sendMessages([
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Please select the template you like. Don't worry, I am not going to send promotions without your confirmation."), false),
			]);

			return "askForTemplateAgain";
		}
	}

	/**
	 * send the selected promotion to the users
	 */
	async sendPromotionToUsers() {
		const self = this;
		const {user, reply, conversationData} = self;

		//check valid payload
		if (!conversationData.payload) {
			//send qr again
			await self.sendMessages([
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Let's finish what we started"), true),
				MyUtils.resolveMessage(reply, user.conversationData.lastQRResponse, false, delayTime),
			]);
			return "sendConfirmationAgain";
		}

		if (conversationData.payload && conversationData.payload.answer === "yes") {

			const appointmentType = deepcopy(user.session['service']);
			const template = deepcopy(user.session['template']);

			//get the clients of the business
			let clients = await self.acuityLogic.getClients();
			MyLog.info("Num of clients before cleaning = " + clients.length);

			//get black list
			const blackList = await self.DBManager.getBlackList({
				$and: [{
					_id: {
						$in: _.map(clients, function (obj) {
							return obj.email;
						})
					}
				}, {
					blockDate: {
						$gt: moment().tz(user.integrations.Acuity.userDetails.timezone).valueOf()
					}
				}]
			});

			const daysRange = 7;
			//get appointments in range of a week
			const appointmentsInWeekRange = await self.acuityLogic.getAppointments({
				minDate: MyUtils.convertToAcuityDate(moment().tz(user.integrations.Acuity.userDetails.timezone).subtract(daysRange, 'days').startOf('day')),
				maxDate: MyUtils.convertToAcuityDate(moment().tz(user.integrations.Acuity.userDetails.timezone).add(daysRange, 'days').endOf('day'))
			});

			//remove clients from black list
			clients = MyUtils.removeClientsExistOnList(blackList, clients, "_id");
			MyLog.info("Num of clients after removing black list = " + clients.length);
			//remove clients from appointments in range of a week
			clients = MyUtils.removeClientsExistOnList(appointmentsInWeekRange, clients, "email");
			MyLog.info("Num of clients after removing clients with appointments = " + clients.length);
			//get 25% from the left customers
			clients = MyUtils.getRandomFromArray(clients, (clients.length / ZoiConfig.generalPromotionDeviation).toFixed(0));
			MyLog.info("Num of clients after deviation by " + ZoiConfig.generalPromotionDeviation + " = " + clients.length);

			//iterate clients
			clients.forEach(function (client) {
				self.sendEmailToClient(client, appointmentType, template);
			});

			//save promotion times
			const actionTime = moment().tz(user.integrations.Acuity.userDetails.timezone).format("YYYY/MM");
			if (user.profile[actionTime]) {
				user.profile[actionTime].numOfPromotions = (user.profile[actionTime].numOfPromotions || 0) + 1;
			} else {
				user.profile[actionTime] = {
					numOfPromotions: 1
				}
			}

			//clear the session and the conversation data
			await self.clearConversation();

			//send messages
			await self.sendMessages([
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("I'm super excited!!! I'll send it right away. 👏"), true),
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Done! 😎 I sent the promotion to " + clients.length + " of your customers."), true, delayTime),
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Your calendar is going to be full in no time"), false, delayTime),
			]);

			if (!user.isOnBoarded) {
				await self.checkAndFinishOnBoarding(true);

				return "promotionSent - proceed with onboarding";
			}

			return "promotionSent";

		} else {
			if (!user.isOnBoarded) {
				await self.checkAndFinishOnBoarding(false);

				return "finishOnBoarding";
			} else {
				await self.clearConversation();
				reply(facebookResponse.getTextMessage("Ok boss"), false);

				return "promotionRejected";
			}
		}
	}

	/**
	 * finish on boarding in case the user still didn't finish it
	 */
	async checkAndFinishOnBoarding(userFinishedFirstPromotion) {
		const self = this;
		const {user, reply} = self;

		const conversationData = {
			userFinishedFirstPromotion,
			context: "WELCOME",
			intent: "welcome acuity integrated",
			lastQuestion: {id: 4},
			payload: {id: 1}
		};
		user.conversationData = conversationData;
		const WelcomeLogic = require('./WelcomeLogic');
		const welcomeLogic = new WelcomeLogic(user, conversationData);
		await welcomeLogic.processIntent();

		return MyUtils.SUCCESS;
	}

	/**
	 * get coupons response object
	 * @returns {*}
	 */
	static getCoupons() {
		return facebookResponse.getGenericTemplate([
			//10 % off
			facebookResponse.getGenericElement("10% discount",
				"http://res.cloudinary.com/gotime-systems/image/upload/v1500935136/10_precent_discount-_no_shadow-02_c8ezyu.png",
				"Offer a discount of 10% to selected customers",
				[facebookResponse.getGenericButton("postback", "I like it", {
					id: 1,
					title: "10% Off",
					zoiCoupon: "Zoi.10PercentOff",
					image: "http://res.cloudinary.com/gotime-systems/image/upload/v1500935136/10_precent_discount-_no_shadow-02_c8ezyu.png",
					color: "#F99C17",
					hoverColor: "#F4771D"
				})]),
			//2 plus 1
			facebookResponse.getGenericElement("2 + 1 deal",
				"http://res.cloudinary.com/gotime-systems/image/upload/v1502450812/2_1_deal-01_g2rrrc.png",
				"Offer 2 + 1 deal to selected customers",
				[facebookResponse.getGenericButton("postback", "I like it", {
					id: 2,
					title: "2 + 1",
					zoiCoupon: "Zoi.2Plus1",
					image: "http://res.cloudinary.com/gotime-systems/image/upload/v1502450812/2_1_deal-01_g2rrrc.png",
					color: "#4AC3C4",
					hoverColor: "#009086"
				})]),
			//25% off
			facebookResponse.getGenericElement("25% discount",
				"http://res.cloudinary.com/gotime-systems/image/upload/v1500931267/25p_vahxwh.png",
				"Offer a discount of 25% to selected customers",
				[facebookResponse.getGenericButton("postback", "I like it", {
					id: 3,
					title: "25% Off",
					zoiCoupon: "Zoi.25PercentOff",
					image: "http://res.cloudinary.com/gotime-systems/image/upload/v1500931267/25p_vahxwh.png",
					color: "#00b0ea",
					hoverColor: "#00a6db"
				})]),
			//1 plus 1
			facebookResponse.getGenericElement("1 + 1 deal",
				"http://res.cloudinary.com/gotime-systems/image/upload/v1500935100/1_1_offer-no-shadow-02_d3klck.png",
				"Offer 1 + 1 deal to selected customers",
				[facebookResponse.getGenericButton("postback", "I like it", {
					id: 4,
					title: "1 + 1",
					zoiCoupon: "Zoi.1Plus1",
					image: "http://res.cloudinary.com/gotime-systems/image/upload/v1500935100/1_1_offer-no-shadow-02_d3klck.png",
					color: "#d1dd25",
					hoverColor: "#c3c62f"
				})]),
			//5% off
			facebookResponse.getGenericElement("5% discount",
				"http://res.cloudinary.com/gotime-systems/image/upload/v1502450747/5_precent_dis-01_lvbaid.png",
				"Offer a discount of 5% to selected customers",
				[facebookResponse.getGenericButton("postback", "I like it", {
					id: 5,
					title: "5% Off",
					zoiCoupon: "Zoi.5PercentOff",
					image: "http://res.cloudinary.com/gotime-systems/image/upload/v1502450747/5_precent_dis-01_lvbaid.png",
					color: "#4AC3C4",
					hoverColor: "#009086"
				})])
		]);
	}

	/**
	 * send email to single client
	 * @param client
	 * @param appointmentType
	 * @param template
	 */
	sendEmailToClient(client, appointmentType, template) {
		const self = this;
		const {user, reply, conversationData} = self;

		if (!client.email) {
			return false;
		}

		//send single email every loop
		const emailList = [{
			address: client.email,
			from: user.integrations.Acuity.userDetails.name + ' <noreply@zoi.ai>',
			subject: EmailConfig.promotionsEmail.subject,
			alt: 'Appointments Promotions',
			replyTo: user.integrations.Acuity.userDetails.email
		}];

		let emailHtml = EmailLib.getEmailByName('promotionsMail');

		//parse the first part
		emailHtml = emailHtml.replace('{{line1}}', EmailConfig.promotionsEmail.line1);
		emailHtml = emailHtml.replace('{{line2}}', EmailConfig.promotionsEmail.line2);
		emailHtml = emailHtml.replace('{{line3}}', EmailConfig.promotionsEmail.line3);
		emailHtml = emailHtml.replace('{{line4}}', EmailConfig.promotionsEmail.line4);
		emailHtml = emailHtml.replace('{{bannerSrc}}', template.image);
		emailHtml = emailHtml.replace('{{preHeaderText}}', EmailConfig.promotionsEmail.subject);

		//parse the second part
		emailHtml = emailHtml.replace('{{firstName}}', client.firstName);
		emailHtml = emailHtml.replace('{{service}}', appointmentType.name);
		emailHtml = emailHtml.replace('{{discount type}}', template.title);
		emailHtml = MyUtils.replaceAll('{{business name}}', user.integrations.Acuity.userDetails.name, emailHtml);
		emailHtml = MyUtils.replaceAll('{{hoverColor}}', template.hoverColor, emailHtml);
		emailHtml = MyUtils.replaceAll('{{color}}', template.color, emailHtml);
		emailHtml = MyUtils.replaceAll('{{buttonText}}', EmailConfig.promotionsEmail.buttonText, emailHtml);
		emailHtml = MyUtils.replaceAll('{{unsubscribeHref}}', ZoiConfig.serverUrl + "/api/unsubscribe?email=" + client.email, emailHtml);

		//set href
		const appointmentParams = {
			firstName: client.firstName,
			lastName: client.lastName,
			email: client.email,
			userId: user._id,
			serviceId: appointmentType.id,
			serviceName: appointmentType.name,
			price: appointmentType.price,
			timezone: user.integrations.Acuity.userDetails.timezone,
			date: (new Date().valueOf()).toString(16),
			notes: template.zoiCoupon,
			promotionTitle: template.title,
			promotionImage: template.image
		};
		const iWantUrl = MyUtils.addParamsToUrl(ZoiConfig.clientUrl + '/appointment-sum', appointmentParams).replace("%", "%25");
		emailHtml = emailHtml.replace('{{href}}', iWantUrl);

		//send the email to the client
		EmailLib.sendEmail(emailHtml, emailList);

		const blockRange = user.customerSendLimit && user.customerSendLimit.value ? user.customerSendLimit.value : 7;

		//unsubscribe this email for X days(do it async)
		self.DBManager.addEmailToUnsubscribe({
			_id: client.email,
			blockDate: moment().tz(user.integrations.Acuity.userDetails.timezone).add(blockRange, 'days').valueOf(),
			blockDateString: moment().tz(user.integrations.Acuity.userDetails.timezone).add(blockRange, 'days').format('lll')
		});

		return true;
	}
}

module.exports = AppointmentLogic;