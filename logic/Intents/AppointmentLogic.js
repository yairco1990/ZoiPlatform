/**
 * Created by Yair on 6/20/2017.
 */
const MyLog = require('../../interfaces/MyLog');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment-timezone');
const facebookResponse = require('../../interfaces/FacebookResponse');
const EmailLib = require('../../interfaces/EmailLib');
const ZoiConfig = require('../../config');
const deepcopy = require('deepcopy');
const EmailConfig = require('../../interfaces/assets/EmailsConfig');
const async = require('async');
const _ = require('underscore');
const ConversationLogic = require('../ConversationLogic');
const FacebookLogic = require('../FacebookLogic');
const LinkShortner = require('../LinkShortnerLogic');

class AppointmentLogic extends ConversationLogic {

	constructor(user, conversationData) {
		super(user, conversationData);
	}

	/**
	 * process the user input
	 */
	async processIntent() {

		switch (this.conversationData.intent) {
			case "appointment what is my schedule":
				await this.getAppointments();
				break;
			case "appointment show my schedule":
				await this.getAppointments();
				break;
			case "appointment send promotions":
				await this.promotionConvoManager();
				break;
		}
	};

	/**
	 * get business's schedule
	 */
	async getAppointments() {

		const {user} = self;

		try {
			await this.sendMessagesV2([
				[facebookResponse.getTextMessage("Let me see...")],
				[facebookResponse.getButtonMessage("Here is your schedule for today boss:", [
					facebookResponse.getGenericButton("web_url", "Agenda", null, ZoiConfig.clientUrl + "/agenda?userId=" + user._id, null)
				])]
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

			//get the next state he wants to go
			const nextState = this.getNextState();
			//set the state he wants to be to his current state
			this.setCurrentState(nextState);

			//if this is the start of the conversation
			if (!user.conversationData) {
				await this.askForPromotion();
			} else if (nextState === "chooseService") {
				await this.askForService();
			} else if (nextState === "chooseDay") {
				await this.askForDay();
			} else if (nextState === "chooseTemplate") {
				await this.askForTemplate();
			} else if (nextState === "askForPromotionConfirmation") {
				if (user.session.promotionType === "email") {
					await this.askForEmailPromotionConfirmation();
				} else if (user.session.promotionType === "facebook") {
					await this.askForFacebookPromotionConfirmation();
				}
			} else if (nextState === "postPromotionOnFacebook" && this.isValidFacebookRequest("postPromotionOnFacebook")) {
				await this.postPromotionOnFacebook();
			} else if (nextState === "dontPostPromotion") {
				await this.dontSendPromotionOnFacebook();
			} else if (nextState === "sendPromotionViaEmail") {
				await this.sendPromotionViaEmail();
			} else if (nextState === "stopConvo") {
				await this.stopConvo();
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
		const {user, conversationData} = self;

		//set next question
		this.setNextAnswerState("qr");

		if (user.isAcuityIntegrated) {

			//add email promotion by default
			const promotionButtons = [
				facebookResponse.getQRButton('text', 'Email Promotion', {
					promotionType: "email",
					nextState: "chooseService"
				})
			];
			//add facebook button if the user integrated with
			if (user.isFacebookIntegrated) {
				promotionButtons.push(facebookResponse.getQRButton('text', 'Post on facebook', {
					promotionType: "facebook",
					nextState: "chooseService"
				}));
			}
			//add 'Maybe Later' button
			promotionButtons.push(facebookResponse.getQRButton('text', 'Maybe later', {
				promotionType: "dontPromote",
				nextState: "stopConvo"
			}));

			//save the response
			const lastQRResponse = self.setLastQRResponse(facebookResponse.getQRElement("Do you want me to promote your openings?",
				promotionButtons
			));

			const {firstText, secondText} = AppointmentLogic.getRelevantSuggestPromotionTexts(conversationData);

			await self.sendMessagesV2([
				[facebookResponse.getTextMessage(firstText)],
				[facebookResponse.getTextMessage(secondText)],
				[lastQRResponse]
			]);

			return "ThereAreOpenSlots";

		}
		//users that didn't integrate with Acuity
		else {

			//save the response
			const lastQRResponse = this.setLastQRResponse(facebookResponse.getQRElement("Do you want me to promote your openings?",
				[
					facebookResponse.getQRButton('text', 'Promote on facebook', {
						promotionType: "facebook",
						nextState: "chooseTemplate"
					}),
					facebookResponse.getQRButton('text', 'Maybe later', {
						promotionType: "dontPromote",
						nextState: "stopConvo"
					})
				]
			));

			await self.sendMessagesV2([
				[lastQRResponse]
			]);

			return "suggestPromotionToNonIntegrated";
		}
	}

	/**
	 * get relevant text for the step we suggest promotion to the user
	 * @param conversationData
	 * @returns {{firstText: string, secondText: string}}
	 */
	static getRelevantSuggestPromotionTexts(conversationData) {
		let firstText = ` want you to let me help with your opening!`;
		let secondText = "I can help you fill them by promoting to your customers";
		if (conversationData.skipHey) {
			firstText = "I also" + firstText;
		} else if (conversationData.firstPromotion) {
			//replace the order
			secondText = "I" + firstText;
			firstText = "Hey boss, we are going to launch our first promotion together! *Excited* ☺";
		} else {
			firstText = "Hey boss, I" + firstText;
		}
		return {firstText, secondText};
	}

	/**
	 * ask which service
	 */
	async askForService() {

		const {user, conversationData} = this;

		try {

			//set promotionType
			user.session = {
				promotionType: conversationData.payload.promotionType
			};

			//set next question
			this.setNextAnswerState("qr");

			//get services with openings
			const appointmentTypesArray = await this.getRelevantServices();

			//create array of qr with the services
			const servicesInQrButtons = appointmentTypesArray.map((service) => {
				service.nextState = "chooseDay";
				return facebookResponse.getQRButton("text", service.name, service);
			});

			//save last qr
			const lastQRResponse = this.setLastQRResponse(facebookResponse.getQRElement("Which service would you like to promote?", servicesInQrButtons));

			//send messages
			await this.sendMessagesV2([
				[facebookResponse.getTextMessage("Great! 😊")],
				[lastQRResponse]
			]);

			return "userGotServicesList";
		} catch (err) {
			MyLog.error("Failed to ask for services", err);
			await this.sendSingleMessage(ZoiConfig.DEFAULT_ERROR_TEXT)
		}
	}

	/**
	 * get relevant services for the promotion
	 * @returns {Promise.<void>}
	 */
	async getRelevantServices() {

		//get the service list
		const appointmentTypes = await this.acuityLogic.getAppointmentTypes();

		//get availability dates for each service
		const availabilityDatesPromises = [];
		appointmentTypes.forEach((appointmentType) => {
			availabilityDatesPromises.push(this.acuityLogic.getAvailabilityDates({
				appointmentTypeID: appointmentType.id,
				month: moment().format('YYYY-MM')
			}));
		});
		return Promise.all(availabilityDatesPromises).then(async (availabilities) => {

			//filter to relevant appointment types(by availability)
			let relevantAppointmentTypes = [];
			availabilities.forEach((availability) => {
				if (availability.dates.length) {
					relevantAppointmentTypes.push(MyUtils.getObjectById(availability.appointmentTypeId, appointmentTypes));
				}
			});
			relevantAppointmentTypes = MyUtils.removeDuplicates(relevantAppointmentTypes);

			//facebook allows maximum 11 qr buttons
			return MyUtils.getRandomFromArray(relevantAppointmentTypes, 11);

		}).catch(function (err) {
			MyLog.error("Failed to get relevant services for promotion", err);
		});
	}

	/**
	 * ask for promotion day
	 */
	async askForDay() {

		try {

			const {user, conversationData} = this;

			//create session if doesn't exist
			if (!user.session) {
				user.session = {};
			}

			if (user.isAcuityIntegrated) {
				//get the service by the user input
				user.session.service = conversationData.payload;
			} else {
				//get the promotionType by the user input
				user.session.promotionType = conversationData.payload.promotionType;
			}

			//set next answer state
			this.setNextAnswerState("qr");

			//get openings dates for the selected service
			const openings = await this.acuityLogic.getAvailabilityDates({
				appointmentTypeID: user.session.service.id,
				month: moment().format('YYYY-MM')
			});

			//get first 10 available dates
			const dates = MyUtils.getFirstNFromArray(openings.dates, 10);

			//create array of qr with the services
			const datesButtons = dates.map((date) => {
				date.nextState = "chooseTemplate";
				return facebookResponse.getQRButton("text", moment(date.date).format('ll'), date);
			});

			//save last qr
			const lastQRResponse = this.setLastQRResponse(facebookResponse.getQRElement("Which date do you want to promote?", datesButtons));

			//send messages
			await this.sendMessagesV2([
				[facebookResponse.getTextMessage("Good choice!")],
				[lastQRResponse],
			]);

			return "userGotTemplateList";
		} catch (err) {
			MyLog.error("Failed to ask for template", err);
			await this.sendSingleMessage(ZoiConfig.DEFAULT_ERROR_TEXT)
		}
	}

	/**
	 * ask for promotion's template
	 */
	async askForTemplate() {

		try {
			const {user, conversationData} = this;

			const nextState = "askForPromotionConfirmation";

			if (!user.session) {
				user.session = {};
			}

			if (user.isAcuityIntegrated) {
				//get the date by the user input
				user.session.date = conversationData.payload.date;
			} else {
				user.session.promotionType = conversationData.payload.promotionType;
			}

			//set next answer state
			this.setNextAnswerState("payload");

			//send messages
			await this.sendMessagesV2([
				[facebookResponse.getTextMessage("I made five types of discount for you to choose from. Which of them you want me to send to your customers?")],
				//get coupons
				[AppointmentLogic.getCoupons(nextState)],
			]);

			return "userGotTemplateList";
		} catch (err) {
			MyLog.error("Failed to ask for template", err);
			await this.sendSingleMessage(ZoiConfig.DEFAULT_ERROR_TEXT)
		}
	}

	/**
	 * ask for email confirmation
	 * @returns {Promise.<string>}
	 */
	async askForEmailPromotionConfirmation() {

		const {user, conversationData} = this;

		try {
			//convert the template
			const template = JSON.parse(conversationData.input);
			user.session.template = template;

			//set next question
			this.setNextAnswerState("payload");

			//get example email template
			const emailHtml = this.createEmailTemplate({
				firstName: "Firstname",
				lastName: "Lastname",
				email: "example@example.com"
			}, 'email', template);

			//save the email template to the user's session
			user.session.emailTemplate = emailHtml;

			await this.sendMessagesV2([
				[facebookResponse.getTextMessage("Excellent! 😉")],
				[facebookResponse.getButtonMessage("I need you to take a look before I send the promotion:", [
					facebookResponse.getGenericButton("web_url", "Email Preview", null, `${ZoiConfig.clientUrl}/promotion-preview?userId=${user._id}`, "tall")
				])]
			]);

			return "userGotConfirmationMessage";
		} catch (err) {
			MyLog.error("Failed to ask for email confirmation", err);
			await this.sendSingleMessage(ZoiConfig.DEFAULT_ERROR_TEXT);
		}
	}

	/**
	 * ask for facebook confirmation
	 * @returns {Promise.<void>}
	 */
	async askForFacebookPromotionConfirmation() {

		const {user, conversationData} = this;

		try {

			//set next question
			this.setNextAnswerState("webview");

			const template = JSON.parse(conversationData.input);

			user.session.template = template;
			if (user.isAcuityIntegrated) {
				user.session.template.promotionTitle = `Schedule today for ${user.session.service.name} and enjoy of ${(template.title).toLowerCase()}`;
			} else {
				user.session.template.promotionTitle = `Schedule today and enjoy of ${(template.title).toLowerCase()}`;
			}

			await this.sendMessagesV2([
				[facebookResponse.getButtonMessage("I need you to take a look before I post the promotion:", [
					facebookResponse.getGenericButton("web_url", "Promotion Preview", null, `${ZoiConfig.clientUrl}/promotion-preview?userId=${user._id}`, "tall")
				])]
			]);
		} catch (err) {
			MyLog.error("Failed to ask for facebook confirmation", err);
			await this.sendSingleMessage(ZoiConfig.DEFAULT_ERROR_TEXT);
		}
	}

	/**
	 * post the selected promotion on facebook
	 */
	async postPromotionOnFacebook() {

		const self = this;
		const {user, conversationData} = self;

		try {
			if (user.isAcuityIntegrated) {

				const template = deepcopy(user.session['template']);
				const appointmentType = deepcopy(user.session['service']);
				const promotionDate = deepcopy(user.session['date']);

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
					date: (new Date(promotionDate).valueOf()).toString(16),
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
				await self.clearConversation(false);

				//send messages
				await self.sendMessagesV2([
					[facebookResponse.getTextMessage("I'm super excited!!! I'll post it right away. 👏")],
					[facebookResponse.getTextMessage("Done! 😎 I posted the promotion on your facebook page.")],
					[facebookResponse.getTextMessage("Your calendar is going to be full in no time")]
				]);

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

				await this.clearConversation(false);

				//send messages
				await self.sendMessagesV2([
					[facebookResponse.getTextMessage("I'm super excited!!! I'll post it right away. 👏")],
					[facebookResponse.getTextMessage("Done! 😎 I posted the promotion on your facebook page.")],
					[facebookResponse.getTextMessage("Your calendar is going to be full in no time")]
				]);

			}

			return "promotionSent";

		} catch (err) {
			MyLog.error("Failed to post promotion on facebook", err);
			await this.sendSingleMessage(ZoiConfig.DEFAULT_ERROR_TEXT);
		}
	}

	/**
	 * dont send promotion on facebook
	 * @returns {Promise.<string>}
	 */
	async dontSendPromotionOnFacebook() {

		await this.clearConversation(false);
		await this.sendSingleMessage("Ok boss! I didn't post it.");

		return "promotionAborted";
	}

	/**
	 * send the selected promotion to the users
	 */
	async sendPromotionViaEmail() {
		const self = this;
		const {user} = self;

		try {

			const appointmentType = deepcopy(user.session['service']);
			const template = deepcopy(user.session['template']);

			//get the clients of the business
			let clients = await self.acuityLogic.getClients();
			MyLog.info("Num of clients before cleaning = " + clients.length);

			if (ZoiConfig.isProduction) {
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
			}

			//iterate clients
			clients.forEach((client) => {
				//get the email template
				const emailHtml = this.createEmailTemplate(client, appointmentType, template);
				//if we got valid emailHtml - send it.
				if (emailHtml) {
					this.sendEmailToClient(client.email, emailHtml);
				}
			});

			//save promotion times
			ConversationLogic.setPromotionsTimesToUser(user);

			//clear the session and the conversation data
			await self.clearConversation(false);

			//send messages
			await self.sendMessagesV2([
				[facebookResponse.getTextMessage("I'm super excited!!! I'll send it right away. 👏")],
				[facebookResponse.getTextMessage("Done! 😎 I sent the promotion to " + clients.length + " of your customers.")],
				[facebookResponse.getTextMessage("Your calendar is going to be full in no time")]
			]);

			return "promotionSent";
		} catch (err) {
			MyLog.error("Failed to send promotion on email", err);
			await this.sendSingleMessage("I failed to send the promotion via email. I will check it right now.");
		}
	}

	/**
	 * get coupons response object
	 * @returns {*}
	 */
	static getCoupons(nextState) {
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
					hoverColor: "#F4771D",
					nextState
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
					hoverColor: "#009086",
					nextState
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
					hoverColor: "#00a6db",
					nextState
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
					hoverColor: "#c3c62f",
					nextState
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
					hoverColor: "#009086",
					nextState
				})])
		]);
	}

	/**
	 * create email template
	 * @param client
	 * @param appointmentType
	 * @param template
	 * @returns {*}
	 */
	createEmailTemplate(client, appointmentType, template) {

		const {user} = this;

		try {

			//return false if there is no email for this client
			if (!client.email) {
				return false;
			}

			let emailHtml = EmailLib.getEmailByName('promotionsMail');

			const promotionDate = deepcopy(user.session['date']);

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
				date: (new Date(promotionDate).valueOf()).toString(16),
				notes: template.zoiCoupon,
				promotionTitle: template.title,
				promotionImage: template.image,
				skipExtension: true
			};
			const iWantUrl = MyUtils.addParamsToUrl(ZoiConfig.clientUrl + '/appointment-sum', appointmentParams).replace("%", "%25");
			emailHtml = emailHtml.replace('{{href}}', iWantUrl);

			return emailHtml;

		} catch (err) {
			MyLog.error(err);
			return false;
		}
	}

	/**
	 * send email to single client
	 * @param clientEmail
	 * @param emailHtml
	 */
	async sendEmailToClient(clientEmail, emailHtml) {

		const {user} = this;

		try {

			//send single email every loop
			const emailDetails = [{
				address: clientEmail,
				from: user.integrations.Acuity.userDetails.name + ' <noreply@zoi.ai>',
				subject: EmailConfig.promotionsEmail.subject,
				alt: 'Appointments Promotions',
				replyTo: user.integrations.Acuity.userDetails.email
			}];

			//send the email to the client
			EmailLib.sendEmail(emailHtml, emailDetails);

			const blockRange = user.customerSendLimit && user.customerSendLimit.value ? user.customerSendLimit.value : 7;

			//unsubscribe this email for X days(do it async)
			await this.DBManager.addEmailToUnsubscribe({
				_id: clientEmail,
				blockDate: moment().tz(user.integrations.Acuity.userDetails.timezone).add(blockRange, 'days').valueOf(),
				blockDateString: moment().tz(user.integrations.Acuity.userDetails.timezone).add(blockRange, 'days').format('lll')
			});

			return true;
		} catch (err) {
			MyLog.error(err);
			return false;
		}
	}
}

module.exports = AppointmentLogic;