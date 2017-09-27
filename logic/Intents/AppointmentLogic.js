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
const FacebookLogic = require('../FacebookLogic');
const LinkShortner = require('../LinkShortnerLogic');

const delayTime = ZoiConfig.delayTime;

//QUESTIONS
const sendPromotionsQuestions = {
	shouldZoiPromote: {
		id: 0
	},
	serviceName: {
		id: 1,
		text: "Which service would you like to promote?",
		field: "service"
	},
	askForPostText: {
		id: "askForPostText",
		field: "postText"
	},
	askForPostImage: {
		id: "askForPostImage",
		field: "postImage"
	},
	askForPostConfirmation: {
		id: "askForPostConfirmation"
	},
	postOnFacebookPage: {
		id: "postPhotoOnFacebookPage"
	},
	whichTemplate: {
		id: 2,
		field: "template"
	},
	askForConfirmation: {
		id: 3
	},
	watchPromotionOnClient: {
		id: "watchPromotionOnClient"
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
				await self.promotionConvoManager();
				break;
		}
	};

	/**
	 * get business's schedule
	 */
	async getAppointments() {
		const self = this;
		const {user, reply} = self;

		try {
			await self.sendMessages([
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Let me see..."), true),
				MyUtils.resolveMessage(reply, facebookResponse.getButtonMessage("Here is your schedule for today boss:", [
					facebookResponse.getGenericButton("web_url", "Agenda", null, ZoiConfig.clientUrl + "/agenda?userId=" + user._id, null)
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
	async promotionConvoManager() {
		const {user} = this;

		try {
			const lastQuestionId = this.getLastQuestionId();

			//if this is the start of the conversation
			if (!user.conversationData) {
				await this.askForPromotion();
			}
			else if (lastQuestionId === sendPromotionsQuestions.shouldZoiPromote.id) {
				if (user.isAcuityIntegrated) {
					await this.askForServiceOrText();
				} else {
					await this.askForTemplate();
				}
			}
			else if (lastQuestionId === sendPromotionsQuestions.askForPostText.id) {
				await this.askForPostImage();
			}
			else if (lastQuestionId === sendPromotionsQuestions.askForPostImage.id) {
				await this.askForPostConfirmation();
			}
			else if (lastQuestionId === sendPromotionsQuestions.askForPostConfirmation.id) {
				await this.postOnFacebookPage();
			}
			else if (lastQuestionId === sendPromotionsQuestions.serviceName.id) {
				await this.askForTemplate();
			}
			else if (lastQuestionId === sendPromotionsQuestions.whichTemplate.id) {
				await this.askForPromotionConfirmation();
			}
			else if (lastQuestionId === sendPromotionsQuestions.askForConfirmation.id) {
				if (user.session.promotionType === "facebook") {
					await this.postPromotionOnFacebook();
				} else {
					await this.sendPromotionViaEmail();
				}
			} else if (lastQuestionId === sendPromotionsQuestions.watchPromotionOnClient.id) {
				await this.postPromotionOnFacebook();
			}
			return MyUtils.SUCCESS;
		} catch (err) {
			MyLog.error(err);
			MyLog.error("Error on send promotions. userId => " + user._id);
			await this.clearConversation();
			return MyUtils.ERROR;
		}
	}

	/**
	 * ask the user if he wants to promote openings
	 */
	async askForPromotion() {
		const self = this;
		const {user, reply, conversationData} = self;

		//set current question
		self.setCurrentQuestion(sendPromotionsQuestions.shouldZoiPromote, "qr");

		if (user.isAcuityIntegrated) {
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

				const promotionTypes = [
					facebookResponse.getQRButton('text', 'Email Promotion', {promotionType: "email"})
				];
				if (user.isFacebookIntegrated) {
					promotionTypes.push(facebookResponse.getQRButton('text', 'Post on facebook', {promotionType: "facebook"}));
				}
				promotionTypes.push(facebookResponse.getQRButton('text', 'Maybe later', {promotionType: "dontPromote"}));

				//save the response
				const lastQRResponse = self.setLastQRResponse(facebookResponse.getQRElement("Do you want me to promote your openings?",
					promotionTypes
				));

				//save the user
				await this.saveUser();

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

				return "ThereAreNoOpenSlots - userOnBoarded";
			}
		}
		//users that didn't integrate with Acuity
		else {

			//save the response
			const lastQRResponse = this.setLastQRResponse(facebookResponse.getQRElement("Do you want me to promote your openings?",
				[
					facebookResponse.getQRButton('text', 'Promote on facebook', {promotionType: "facebook"}),
					facebookResponse.getQRButton('text', 'Maybe later', {promotionType: "dontPromote"})
				]
			));

			await this.saveUser();

			await self.sendMessages([
				MyUtils.resolveMessage(reply, lastQRResponse, false, delayTime),
			]);

			return "suggestPromotionToNonIntegrated";
		}
	}

	/**
	 * ask which service
	 * TODO: change the name, from now he can post on facebook without getting the services list
	 */
	async askForServiceOrText() {

		const self = this;
		const {user, reply, conversationData} = self;

		if (conversationData.payload) {

			//if the user said he wants to send promotion
			if (conversationData.payload.promotionType === "email" || conversationData.payload.promotionType === "facebook") {

				//set promotionType
				user.session = {
					promotionType: conversationData.payload.promotionType
				};

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
				await this.saveUser();

				//send messages
				await self.sendMessages([
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Great! 😊"), true),
					MyUtils.resolveMessage(reply, lastQRResponse, false, delayTime),
				]);

				return "userGotServicesList";
			}
			//if the user wants to quit
			else {

				await this.clearConversation();

				//send messages
				await self.sendMessages([
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("I'll be right here if you need me ☺"), false)
				]);

				return "userQuitPromotionProcess";
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
	 * ask for post image
	 */
	async askForPostImage() {

		const {user, reply, conversationData} = this;

		try {
			//init the session
			user.session = {};

			//set the post text to the session
			user.session[user.conversationData.lastQuestion.field] = conversationData.input;

			//ask for post text
			this.setCurrentQuestion(sendPromotionsQuestions.askForPostImage, "text");

			//save the user
			await this.DBManager.saveUser(user);

			//send messages
			await this.sendMessages([
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Please send me the picture you want to post"), false, delayTime)
			]);

			return "userAskedForPostImage";
		} catch (err) {
			MyLog.error("Failed to ask for post image", err);
		}
	}

	/**
	 * ask for post confirmation
	 */
	async askForPostConfirmation() {

		const {user, reply, conversationData} = this;

		try {

			//set the post text to the session
			user.session[user.conversationData.lastQuestion.field] = conversationData.input;

			//ask for post text
			this.setCurrentQuestion(sendPromotionsQuestions.askForPostConfirmation, "qr");

			//save last qr
			user.conversationData.lastQRResponse = facebookResponse.getQRElement("Just to be clear, I am about to post the text and the image you sent me on your facebook pages.", [
				facebookResponse.getQRButton("text", "Yes, post it.", {answer: "yes"}),
				facebookResponse.getQRButton("text", "No, don't post it.", {answer: "no"})
			]);

			//save the user
			await this.DBManager.saveUser(user);

			//send messages
			await this.sendMessages([
				MyUtils.resolveMessage(reply, user.conversationData.lastQRResponse, false, delayTime),
			]);

			return "userAskedForPostConfirmation";
		} catch (err) {
			MyLog.error("Failed to ask for post confirmation", err);
			return "failed";
		}
	}

	/**
	 * post on user's facebook page
	 */
	async postOnFacebookPage() {

		const {user, reply, conversationData} = this;

		try {

			if (MyUtils.nestedValue(conversationData, "payload.answer") === "yes") {

				const postText = user.session['postText'];
				const postImage = user.session['postImage'];

				//start posting on user's pages
				user.integrations.Facebook.pages.forEach((page) => FacebookLogic.postPhotoOnUserPages(user, {
					message: postText,
					url: postImage
				}));

				//save the user
				await this.DBManager.saveUser(user);

				await this.clearConversation();

				//send messages
				await this.sendMessages([
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("I'm super excited!!! I'll post it right away. 👏"), true),
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Done! 😎 I posted the promotion on your facebook pages."), false, delayTime)
				]);

				return "userAskedForPostConfirmation";
			}
			//
			else if (MyUtils.nestedValue(conversationData, "payload.answer") === "no") {

				user.conversationData = null;
				user.session = null;

				//save the user
				await this.DBManager.saveUser(user);

				//send messages
				await this.sendMessages([
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("I'll be right here if you need me ☺"), false)
				]);

				return "userQuitPostOnFacebookProcess";
			}
			//send qr again
			else {
				await this.sendMessages([
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Let's finish what we started"), true),
					MyUtils.resolveMessage(reply, user.conversationData.lastQRResponse, false, delayTime),
				]);

				return "sendConfirmationAgain";
			}
		} catch (err) {
			MyLog.error("Failed to post on facebook pages", err);
			return "failed";
		}
	}

	/**
	 * ask for promotion's template
	 */
	async askForTemplate() {

		const self = this;
		const {user, reply, conversationData} = self;

		if (conversationData.payload) {

			if (MyUtils.nestedValue(conversationData, "payload.promotionType") !== "dontPromote") {
				if (user.isAcuityIntegrated) {
					//get the service by the user input
					user.session["service"] = conversationData.payload;
				} else {
					user.session = {promotionType: conversationData.payload.promotionType};
				}

				//set current question
				self.setCurrentQuestion(sendPromotionsQuestions.whichTemplate, "payload");

				//save the user
				await this.saveUser();

				//send messages
				await self.sendMessages([
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("I made five types of discount for you to choose from.  Which of them you want me to send to your customers?"), true),
					//get coupons
					MyUtils.resolveMessage(reply, AppointmentLogic.getCoupons(), false, delayTime),
				]);

				return "userGotTemplateList";
			} else {
				await self.clearConversation();
				reply(facebookResponse.getTextMessage("Ok boss. Talk to me later! ;)"), false);

				return "promotionRejected";
			}
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
	 * ask the owner to confirm the promotion
	 */
	async askForPromotionConfirmation() {
		const self = this;
		const {user, reply, conversationData} = self;

		//check valid answer
		if (MyUtils.isJson(conversationData.input)) {

			//get the template
			const template = JSON.parse(conversationData.input);
			user.session.template = template;

			if (user.isAcuityIntegrated) {

				if (user.session.promotionType === "email") {

					//set next question
					this.setCurrentQuestion(sendPromotionsQuestions.askForConfirmation, "qr");

					const questionText = `Just to be clear, I am about to send ${template.title} promotion for ${user.session.service.name} to your customers?`;
					const yesButtonText = "Yes, send it!";
					const noButtonText = "No, don't send it.";

					//save last qr
					user.conversationData.lastQRResponse = facebookResponse.getQRElement(questionText, [
						facebookResponse.getQRButton("text", yesButtonText, {answer: "yes"}),
						facebookResponse.getQRButton("text", noButtonText, {answer: "no"})
					]);

					//save the user
					await this.saveUser();

					//send messages
					await self.sendMessages([
						MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Excellent! 😉"), true),
						MyUtils.resolveMessage(reply, user.conversationData.lastQRResponse, false, delayTime),
					]);

					return "userGotConfirmationMessage";
				} else {

					user.session.template.promotionTitle = `Schedule today for ${user.session.service.name} and enjoy of ${template.title}`;

					this.setCurrentQuestion(sendPromotionsQuestions.watchPromotionOnClient);

					await this.saveUser();

					await this.sendMessages([
						MyUtils.resolveMessage(reply, facebookResponse.getButtonMessage("I need you to take a look before I post the promotion:", [
							facebookResponse.getGenericButton("web_url", "Promotion Preview", null, `${ZoiConfig.clientUrl}/promotion-preview?userId=${user._id}`, "tall")
						]), false)
					]);
				}
			}
			//show on client for non-integrated with Acuity
			else {

				user.session.template.promotionTitle = `Schedule today and enjoy of ${template.title}`;

				this.setCurrentQuestion(sendPromotionsQuestions.watchPromotionOnClient);

				await this.saveUser();

				await this.sendMessages([
					MyUtils.resolveMessage(reply, facebookResponse.getButtonMessage("I need you to take a look before I post the promotion:", [
						facebookResponse.getGenericButton("web_url", "Promotion Preview", null, ZoiConfig.clientUrl + "/promotion-preview?userId=" + user._id, "tall")
					]), false)
				]);
			}
		} else {
			//case he was typing
			await self.sendMessages([
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Please select the template you like. Don't worry, I am not going to send promotions without your confirmation."), false),
			]);

			return "askForTemplateAgain";
		}
	}

	/**
	 * post the selected promotion on facebook
	 */
	async postPromotionOnFacebook() {
		const self = this;
		const {user, reply, conversationData} = self;

		//check that user said yes
		if (MyUtils.nestedValue(conversationData, "payload.answer") === "yes") {

			if (user.isAcuityIntegrated) {
				const template = deepcopy(user.session['template']);
				const appointmentType = deepcopy(user.session['service']);
				const selectedPromotion = conversationData.payload;

				const appointmentParams = {
					firstName: "",
					lastName: "",
					email: "",
					userId: user._id,
					serviceId: appointmentType.id,
					serviceName: appointmentType.name,
					price: appointmentType.price,
					timezone: user.integrations.Acuity.userDetails.timezone,
					date: (new Date().valueOf()).toString(16),
					notes: template.zoiCoupon,
					promotionTitle: template.title,
					promotionImage: template.image,
					promotionType: "facebook",
					skipExtension: true
				};
				const appointmentSumUrl = MyUtils.addParamsToUrl(ZoiConfig.clientUrl + '/appointment-sum', appointmentParams).replace("%", "%25");

				//create short link of zoi
				const shortnerId = await LinkShortner.saveLink(appointmentSumUrl);

				let schedulingLink = `${ZoiConfig.shortnerUrl}/${shortnerId}`;
				//remove the port
				schedulingLink = schedulingLink.replace(":3000", "");

				//post on facebook page
				FacebookLogic.postPhotoOnUserPages(user, {
					message: selectedPromotion.title + "\n" + schedulingLink,
					url: selectedPromotion.imageUrl
				});

				//save promotion times
				ConversationLogic.setPromotionsTimesToUser(user);

				//clear the session and the conversation data
				await self.clearConversation();

				//send messages
				await self.sendMessages([
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("I'm super excited!!! I'll post it right away. 👏"), true),
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Done! 😎 I posted the promotion on your facebook page."), true, delayTime),
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Your calendar is going to be full in no time"), false, delayTime),
				]);

				return "promotionSent";
			} else {

				const selectedPromotion = conversationData.payload;

				let message = selectedPromotion.title;

				//if link exist - add it to the message
				if (selectedPromotion.link) {
					message += "\n" + selectedPromotion.link;
				}

				//post on facebook page
				FacebookLogic.postPhotoOnUserPages(user, {
					message: message,
					url: selectedPromotion.imageUrl
				});

				await this.clearConversation();

				//send messages
				await self.sendMessages([
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("I'm super excited!!! I'll post it right away. 👏"), true),
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Done! 😎 I posted the promotion on your facebook page."), true, delayTime),
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Your calendar is going to be full in no time"), false, delayTime),
				]);
			}


		} else {

			await self.clearConversation();
			reply(facebookResponse.getTextMessage("Ok boss. See you later! :)"), false);

			return "promotionRejected";
		}
	}

	/**
	 * send the selected promotion to the users
	 */
	async sendPromotionViaEmail() {
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

		//check that user said yes
		if (MyUtils.nestedValue(conversationData, "payload.answer") === "yes") {

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
			ConversationLogic.setPromotionsTimesToUser(user);

			//clear the session and the conversation data
			await self.clearConversation();

			//send messages
			await self.sendMessages([
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("I'm super excited!!! I'll send it right away. 👏"), true),
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Done! 😎 I sent the promotion to " + clients.length + " of your customers."), true, delayTime),
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Your calendar is going to be full in no time"), false, delayTime),
			]);

			return "promotionSent";

		} else {

			await self.clearConversation();
			reply(facebookResponse.getTextMessage("Ok boss. Talk to me later! ;)"), false);

			return "promotionRejected";
		}
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
					image: "https://res.cloudinary.com/gotime-systems/image/upload/v1500935136/10_precent_discount-_no_shadow-02_c8ezyu.png",
					color: "#F99C17",
					hoverColor: "#F4771D"
				})]),
			//2 plus 1
			facebookResponse.getGenericElement("2 + 1 deal",
				"http://res.cloudinary.com/gotime-systems/image/upload/v1502450812/2_1_deal-01_g2rrrc.png",
				"Offer 2 + 1 deal to selected customers",
				[facebookResponse.getGenericButton("postback", "I like it", {
					id: 2,
					title: "2 + 1 deal",
					zoiCoupon: "Zoi.2Plus1",
					image: "https://res.cloudinary.com/gotime-systems/image/upload/v1502450812/2_1_deal-01_g2rrrc.png",
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
					image: "https://res.cloudinary.com/gotime-systems/image/upload/v1500931267/25p_vahxwh.png",
					color: "#00b0ea",
					hoverColor: "#00a6db"
				})]),
			//1 plus 1
			facebookResponse.getGenericElement("1 + 1 deal",
				"http://res.cloudinary.com/gotime-systems/image/upload/v1500935100/1_1_offer-no-shadow-02_d3klck.png",
				"Offer 1 + 1 deal to selected customers",
				[facebookResponse.getGenericButton("postback", "I like it", {
					id: 4,
					title: "1 + 1 deal",
					zoiCoupon: "Zoi.1Plus1",
					image: "https://res.cloudinary.com/gotime-systems/image/upload/v1500935100/1_1_offer-no-shadow-02_d3klck.png",
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
					image: "https://res.cloudinary.com/gotime-systems/image/upload/v1502450747/5_precent_dis-01_lvbaid.png",
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
			promotionImage: template.image,
			skipExtension: true
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