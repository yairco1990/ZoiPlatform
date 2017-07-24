/**
 * Created by Yair on 6/20/2017.
 */
const Util = require('util');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment');
const facebookResponse = require('../../interfaces/FacebookResponse');
const MindbodyLogic = require('../ApiHandlers/MindbodyLogic');
const AcuityLogic = require('../ApiHandlers/AcuitySchedulingLogic');
const MindbodyFactory = require('../../interfaces/Factories/MindbodyFactory');
const EmailLib = require('../../interfaces/EmailLib');
const ZoiConfig = require('../../config');
const deepcopy = require('deepcopy');
const EmailConfig = require('../../interfaces/assets/EmailsConfig');

const delayTime = ZoiConfig.delayTime || 3000;

function AppointmentLogic(user) {
	this.user = user;
	//get the single instance of DBManager
	this.DBManager = require('../../dal/DBManager');
	this.mindbodyLogic = new MindbodyLogic({});
}

/**
 * process the user input
 */
AppointmentLogic.prototype.processIntent = function (conversationData, setBotTyping, requestObj, callback) {
	let self = this;

	switch (conversationData.intent) {
		case "appointment what is my schedule":
			self.getAppointments(conversationData, callback);
			break;
		case "appointment bring next free slot":
			setBotTyping();
			self.getNextFreeSlot(conversationData, callback);
			break;
		case "appointment book for customer":
			setBotTyping();
			self.bookForCustomer(conversationData, callback);
			break;
		case "appointment send promotions":
			setBotTyping();
			self.sendPromotions(conversationData, callback);
			break;
	}
};

/**
 * get appointments
 */
AppointmentLogic.prototype.getAppointments = function (conversationData, callback) {
	let self = this;
	let user = self.user;

	callback(facebookResponse.getTextMessage("Let me see..."), true);

	setTimeout(function () {

		callback(facebookResponse.getButtonMessage("This is your schedule for today sir:", [
			facebookResponse.getGenericButton("web_url", "Watch your schedule", null, ZoiConfig.clientUrl + "/agenda?userId=" + user._id, "full")
		]));

		setTimeout(function () {
			callback(facebookResponse.getTextMessage("Anything else?"));
		}, delayTime);

	}, delayTime);
};

const nextFreeSlotQuestions = {
	serviceQuestion: {
		id: 1,
		text: "For which service?",
		field: "serviceObject"
	}
};
/**
 * get next free slot
 */
AppointmentLogic.prototype.getNextFreeSlot = function (conversationData, callback) {
	let self = this;
	let user = self.user;

	//if this is the start of the conversation
	if (!user.conversationData) {
		//ask which service
		let question = nextFreeSlotQuestions.serviceQuestion;

		//save conversation to the user
		user.conversationData = conversationData;
		//save the service question
		user.conversationData.lastQuestion = question;
		//create session object to store the user data during the session
		// user.session = {};
		//save the user
		self.DBManager.saveUser(user).then(function () {
			callback(facebookResponse.getTextMessage(question.text));
		});
	}
	else if (user.conversationData.lastQuestion.id === nextFreeSlotQuestions.serviceQuestion.id) {

		//get the services list
		self.mindbodyLogic.getSessionTypes().then(function (services) {

			user.session = {};
			//get the service by the user input
			user.session[user.conversationData.lastQuestion.field] = MyUtils.getSimilarityFromArray(conversationData.input, services, 'Name');

			//get the next free slot with the service id
			self.mindbodyLogic.getNextFreeSlot({sessionTypeId: user.session.serviceObject.ID}).then(function (slots) {

				let responseText = "";
				if (slots.length) {
					let slot = slots[1];
					responseText = "The next free slot for " + user.session.serviceObject.Name + " is at " + moment(slot.StartDateTime).format("HH:mm MM/DD");

					user.session.nextFreeSlot = slot;
				} else {
					responseText = "There are no available slots for this service";
				}

				//clean conversation data
				user.conversationData = null;

				self.DBManager.saveUser(user).then(function () {
					callback(facebookResponse.getTextMessage(responseText));

					setTimeout(function () {
						callback(facebookResponse.getTextMessage("Is there another thing you want to do sir?"))
					}, delayTime);
				});
			});
		});
	}
};

/**
 * book for customer for free slot
 * the session must contains details about free slot!
 * @param conversationData
 * @param callback
 */
AppointmentLogic.prototype.bookForCustomer = function (conversationData, callback) {
	let self = this;
	let user = self.user;

	//validate request
	if (!conversationData.entities.CUSTOMER && !conversationData.entities.person) {
		callback(facebookResponse.getTextMessage("Need details about the customer"));
		return;
	}
	if (!user.session || !user.session.nextFreeSlot) {
		callback(facebookResponse.getTextMessage("Need details about the required slot"));
		return;
	}

	self.mindbodyLogic.getClients(conversationData.entities).then(function (customers) {
		if (!customers.length) {
			callback(facebookResponse.getTextMessage("Didn't found customer with this name"));
			return;
		}

		let customer = customers[0];
		let slot = user.session.nextFreeSlot;

		let appointmentObject = {
			Appointments: {
				Appointment: {
					Location: {
						ID: slot.Location.ID
					},
					Staff: {
						ID: slot.Staff.ID
					},
					Client: {
						ID: customer.ID
					},
					SessionType: {
						ID: slot.SessionType.ID
					},
					StartDateTime: moment(slot.StartDateTime).format('YYYY-MM-DDTHH:mm:ss')
				}
			},
			UpdateAction: "AddNew"
		};
		self.mindbodyLogic.bookAppointment(appointmentObject).then(function (result) {
			console.log(result);
			callback(facebookResponse.getTextMessage("Booked successfully for " + customer.FirstName + " " + customer.LastName));
		}).catch(function (err) {
			if (err.errorReason) {
				callback(facebookResponse.getTextMessage(err.errorReason));
			} else {
				callback(facebookResponse.getTextMessage("Try to book for " + customer.FirstName));
			}
		});
	});
};


const sendPromotionsQuestions = {
	toPromote: {
		id: 0
	},
	serviceName: {
		id: 1,
		text: "Which service (from your Acuity appointment types) would you like to promote?",
		field: "service"
	},
	whichTemplate: {
		id: 2,
		text: "I made three types of discount for you to choose from.  Which of them you want me to send to your customers?",
		field: "template"
	},
	areYouSure: {
		id: 3,
		text: "Just so we clear, I am about to send {promotionName} promotion for {serviceName} to your customers?"
	}
};

/**
 * send promotions
 */
AppointmentLogic.prototype.sendPromotions = function (conversationData, callback) {
	let self = this;
	let user = self.user;

	let acuityLogic = new AcuityLogic(user.integrations.Acuity.accessToken);
	let lastQuestionId = user.conversationData && user.conversationData.lastQuestion ? user.conversationData.lastQuestion.id : null;

	//if this is the start of the conversation
	if (!user.conversationData) {
		//ask if he wants to promote
		let question = sendPromotionsQuestions.toPromote;

		//save conversation to the user
		user.conversationData = conversationData;
		//save the service question
		user.conversationData.lastQuestion = question;

		//get services
		acuityLogic.getAppointmentTypes().then(function (appointmentTypes) {
			let options = {
				appointmentTypeID: appointmentTypes[0].id,
				date: moment().add(1, 'days').format('YYYY-MM-DDTHH:mm:ss')
			};
			//get slots
			return acuityLogic.getAvailability(options);
		}).then(function (slots) {

			//save the response
			let lastQRResponse = facebookResponse.getQRElement("Do you want me to promote your openings?",
				[
					facebookResponse.getQRButton('text', 'Email Promotion', {id: 1}),
					facebookResponse.getQRButton('text', 'Maybe later', {id: 2})
				]
			);
			user.conversationData.lastQRResponse = lastQRResponse;

			//save the user
			self.DBManager.saveUser(user).then(function () {
				setTimeout(function () {
					let firstText = " noticed that you have " + slots.length + " openings on your calendars tomorrow.";
					if (!conversationData.skipHey) {
						firstText = "Hey boss, I" + firstText;
					} else {
						firstText = "I also" + firstText;
					}
					callback(facebookResponse.getTextMessage(firstText), true);

					setTimeout(function () {
						callback(facebookResponse.getTextMessage("I can help you fill the openings by promoting to your customers"), true);

						setTimeout(function () {
							callback(lastQRResponse);

						}, delayTime);
					}, delayTime);
				}, delayTime);
			});
		});
	}
	else if (lastQuestionId === sendPromotionsQuestions.toPromote.id) {

		if (conversationData.payload) {

			if (conversationData.payload.id == 1) {

				callback(facebookResponse.getTextMessage("Great! 😊"), true);

				//ask which service
				let question = sendPromotionsQuestions.serviceName;
				//save conversation to the user
				user.conversationData = conversationData;
				//save the service question
				user.conversationData.lastQuestion = question;

				//save the user
				self.DBManager.saveUser(user).then(function () {
					setTimeout(function () {
						callback(facebookResponse.getTextMessage(question.text));
					}, delayTime);
				});
			} else {

				user.conversationData = null;
				user.session = null;

				//save the user
				self.DBManager.saveUser(user).then(function () {
					callback(facebookResponse.getTextMessage("I'll be right here if you need me ☺"));
				});
			}
		} else {
			callback(user.conversationData.lastQRResponse);
		}
	}
	else if (lastQuestionId === sendPromotionsQuestions.serviceName.id) {

		//get the service list
		acuityLogic.getAppointmentTypes().then(function (appointmentTypes) {

			//init the session
			user.session = {};

			//get the service by the user input
			let service = MyUtils.getSimilarityFromArray(conversationData.input, appointmentTypes, 'name');
			user.session[user.conversationData.lastQuestion.field] = service;

			//ask for template
			let currentQuestion = sendPromotionsQuestions.whichTemplate;
			//set current question
			user.conversationData.lastQuestion = currentQuestion;

			//save the user
			self.DBManager.saveUser(user).then(function () {

				callback(facebookResponse.getTextMessage(currentQuestion.text), true);

				setTimeout(function () {
					callback(facebookResponse.getGenericTemplate([
						//coupon
						facebookResponse.getGenericElement("10% off massage treatments",
							"http://res.cloudinary.com/gotime-systems/image/upload/v1500935136/10_precent_discount-_no_shadow-02_c8ezyu.png",
							"Book a massage now and get 10% off",
							[facebookResponse.getGenericButton("postback", "I like it", {
								id: 1,
								title: "10% Off",
								zoiCoupon: "Zoi.10PercentOff",
								image: "http://res.cloudinary.com/gotime-systems/image/upload/v1500935136/10_precent_discount-_no_shadow-02_c8ezyu.png",
								color: "#F99C17",
								hoverColor: "#F4771D"
							})]),
						//25% off
						facebookResponse.getGenericElement("25% off massage treatments",
							"http://res.cloudinary.com/gotime-systems/image/upload/v1500931267/25p_vahxwh.png",
							"Book a massage now and get 25% off",
							[facebookResponse.getGenericButton("postback", "I like it", {
								id: 2,
								title: "25% Off",
								zoiCoupon: "Zoi.25PercentOff",
								image: "http://res.cloudinary.com/gotime-systems/image/upload/v1500931267/25p_vahxwh.png",
								color: "#00b0ea",
								hoverColor: "#00a6db"
							})]),
						//1 plus 1
						facebookResponse.getGenericElement("1 + 1 on face treatments",
							"http://res.cloudinary.com/gotime-systems/image/upload/v1500935100/1_1_offer-no-shadow-02_d3klck.png",
							"Get 2 treatments for the price of one. Book now to claim your reward.",
							[facebookResponse.getGenericButton("postback", "I like it", {
								id: 3,
								title: "1 + 1",
								zoiCoupon: "Zoi.1Plus1",
								image: "http://res.cloudinary.com/gotime-systems/image/upload/v1500935100/1_1_offer-no-shadow-02_d3klck.png",
								color: "#d1dd25",
								hoverColor: "#c3c62f"
							})])
					]));
				}, delayTime);
			});
		});
	} else if (lastQuestionId === sendPromotionsQuestions.whichTemplate.id) {

		//get the template
		let template = JSON.parse(conversationData.input);
		user.session[user.conversationData.lastQuestion.field] = template;

		//ask if he is sure
		let currentQuestion = sendPromotionsQuestions.areYouSure;
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
		self.DBManager.saveUser(user).then(function () {
			callback(user.conversationData.lastQRResponse);
		});

	} else if (lastQuestionId === sendPromotionsQuestions.areYouSure.id) {

		if (conversationData.payload) {
			if (conversationData.payload && conversationData.payload.answer == "yes") {

				let appointmentType = user.session['service'];
				let template = user.session['template'];

				//get the clients of the business
				acuityLogic.getClients().then(function (clients) {

					//get email file
					EmailLib.getEmailFile(__dirname + "/../../interfaces/assets/promotionsMail.html").then(function (emailFileSource) {

						//iterate clients
						clients.forEach(function (client) {

							//send single email every loop
							let emailList = [{
								address: client.email,
								from: 'Zoi.AI <noreply@fobi.io>',
								subject: 'Test Subject',
								alt: 'Test Alt'
							}];

							let emailFile = deepcopy(emailFileSource);

							//parse the first part
							emailFile = emailFile.replace('{{line1}}', EmailConfig.promotionsEmail.line1);
							emailFile = emailFile.replace('{{line2}}', EmailConfig.promotionsEmail.line2);
							emailFile = emailFile.replace('{{line3}}', EmailConfig.promotionsEmail.line3);
							emailFile = emailFile.replace('{{line4}}', EmailConfig.promotionsEmail.line4);
							emailFile = emailFile.replace('{{bannerSrc}}', template.image);

							//parse the second part
							emailFile = emailFile.replace('{{Business name}}', user.integrations.Acuity.userDetails.name);
							emailFile = emailFile.replace('{{business_name}}', user.integrations.Acuity.userDetails.name);
							emailFile = emailFile.replace('{{firstName}}', client.firstName);
							emailFile = emailFile.replace('{{business name}}', user.integrations.Acuity.userDetails.name);
							emailFile = emailFile.replace('{{service}}', appointmentType.name);
							emailFile = emailFile.replace('{{discount type}}', template.title);
							emailFile = MyUtils.replaceAll('{{hoverColor}}', template.hoverColor, emailFile);
							emailFile = MyUtils.replaceAll('{{color}}', template.color, emailFile);

							//send the email to the client
							EmailLib.sendEmail(emailFile, emailList);

						});

						//save promotion times
						let actionTime = moment().format("YYYY/MM");
						user.profile = user.profile || {};
						if (user.profile[actionTime]) {
							user.profile[actionTime].numOfPromotions = (user.profile[actionTime].numOfPromotions || 0) + 1;
						} else {
							user.profile[actionTime] = {
								numOfPromotions: 1
							}
						}

						//clear the session and the conversation data
						self.clearSession();
						callback(facebookResponse.getTextMessage("I'm super excited!!! I'll send it right away. 👏"));
						setTimeout(function () {
							callback(facebookResponse.getTextMessage("Done! 😎 I sent the promotion to " + clients.length + " of your customers."));
							setTimeout(function () {
								callback(facebookResponse.getTextMessage("Your calendar is going to be full in no time"));
							}, delayTime);
						}, delayTime);

					});
				}).catch(function (err) {
					Util.log("Error:");
					Util.log(err);
				});
			} else {
				self.clearSession();
				callback(facebookResponse.getTextMessage("Ok boss"));
			}
		} else {
			callback(user.conversationData.lastQRResponse);
		}
	}
};

/**
 * clear user session
 */
AppointmentLogic.prototype.clearSession = function () {
	let self = this;
	let user = self.user;

	//clear conversation data
	user.conversationData = null;
	user.session = null;
	self.DBManager.saveUser(user).then(function () {
		Util.log("conversation cleared!");
	});
};

module.exports = AppointmentLogic;