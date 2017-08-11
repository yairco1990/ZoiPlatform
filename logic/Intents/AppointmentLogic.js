/**
 * Created by Yair on 6/20/2017.
 */
const MyLog = require('../../interfaces/MyLog');
const MyUtils = require('../../interfaces/utils');
const moment = require('moment-timezone');
const facebookResponse = require('../../interfaces/FacebookResponse');
const MindbodyLogic = require('../ApiHandlers/MindbodyLogic');
const AcuityLogic = require('../ApiHandlers/AcuitySchedulingLogic');
const MindbodyFactory = require('../../interfaces/Factories/MindbodyFactory');
const EmailLib = require('../../interfaces/EmailLib');
const ZoiConfig = require('../../config');
const deepcopy = require('deepcopy');
const EmailConfig = require('../../interfaces/assets/EmailsConfig');
const async = require('async');
const _ = require('underscore');

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
AppointmentLogic.prototype.processIntent = function (conversationData, setBotTyping, requestObj, reply) {
	let self = this;

	switch (conversationData.intent) {
		case "appointment what is my schedule":
			self.getAppointments(conversationData, reply);
			break;
		case "appointment show my schedule":
			self.getAppointments(conversationData, reply);
			break;
		// case "appointment bring next free slot":
		// 	setBotTyping();
		// 	self.getNextFreeSlot(conversationData, reply);
		// 	break;
		case "appointment send promotions":
			setBotTyping && setBotTyping();
			self.sendPromotions(conversationData, reply);
			break;
	}
};

/**
 * get appointments
 */
AppointmentLogic.prototype.getAppointments = function (conversationData, reply) {
	let self = this;
	let user = self.user;

	async.series([
		MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Let me see..."), true),
		MyUtils.resolveMessage(reply, facebookResponse.getButtonMessage("Here is your schedule for today boss:", [
			facebookResponse.getGenericButton("web_url", "Agenda", null, ZoiConfig.clientUrl + "/agenda?userId=" + user._id, "full")
		]), true, delayTime),
		MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Anything else?"), false, delayTime)
	], MyUtils.getErrorMsg());

};

// const nextFreeSlotQuestions = {
// 	serviceQuestion: {
// 		id: 1,
// 		text: "For which service?",
// 		field: "serviceObject"
// 	}
// };
/**
 * get next free slot
 */
// AppointmentLogic.prototype.getNextFreeSlot = function (conversationData, reply) {
// 	let self = this;
// 	let user = self.user;
//
// 	//if this is the start of the conversation
// 	if (!user.conversationData) {
// 		//ask which service
// 		let question = nextFreeSlotQuestions.serviceQuestion;
//
// 		//save conversation to the user
// 		user.conversationData = conversationData;
// 		//save the service question
// 		user.conversationData.lastQuestion = question;
// 		//create session object to store the user data during the session
// 		// user.session = {};
// 		//save the user
// 		self.DBManager.saveUser(user).then(function () {
// 			reply(facebookResponse.getTextMessage(question.text), true);
// 		});
// 	}
// 	else if (user.conversationData.lastQuestion.id === nextFreeSlotQuestions.serviceQuestion.id) {
//
// 		//get the services list
// 		self.mindbodyLogic.getSessionTypes().then(function (services) {
//
// 			user.session = {};
// 			//get the service by the user input
// 			user.session[user.conversationData.lastQuestion.field] = MyUtils.getSimilarityFromArray(conversationData.input, services, 'Name');
//
// 			//get the next free slot with the service id
// 			self.mindbodyLogic.getNextFreeSlot({sessionTypeId: user.session.serviceObject.ID}).then(function (slots) {
//
// 				let responseText = "";
// 				if (slots.length) {
// 					let slot = slots[1];
// 					responseText = "The next free slot for " + user.session.serviceObject.Name + " is at " + moment(slot.StartDateTime).format("HH:mm MM/DD");
//
// 					user.session.nextFreeSlot = slot;
// 				} else {
// 					responseText = "There are no available slots for this service";
// 				}
//
// 				//clean conversation data
// 				user.conversationData = null;
//
// 				self.DBManager.saveUser(user).then(function () {
// 					async.series([
// 						MyUtils.resolveMessage(reply, facebookResponse.getTextMessage(responseText), true),
// 						MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Is there another thing you want to do sir?"), false, delayTime)
// 					], MyUtils.getErrorMsg());
// 				});
// 			});
// 		});
// 	}
// };

/**
 * book for customer for free slot
 * the session must contains details about free slot!
 * @param conversationData
 * @param reply
 */
// AppointmentLogic.prototype.bookForCustomer = function (conversationData, callback) {
// 	let self = this;
// 	let user = self.user;
//
// 	//validate request
// 	if (!conversationData.entities.CUSTOMER && !conversationData.entities.person) {
// 		callback(facebookResponse.getTextMessage("Need details about the customer"));
// 		return;
// 	}
// 	if (!user.session || !user.session.nextFreeSlot) {
// 		callback(facebookResponse.getTextMessage("Need details about the required slot"));
// 		return;
// 	}
//
// 	self.mindbodyLogic.getClients(conversationData.entities).then(function (customers) {
// 		if (!customers.length) {
// 			callback(facebookResponse.getTextMessage("Didn't found customer with this name"));
// 			return;
// 		}
//
// 		let customer = customers[0];
// 		let slot = user.session.nextFreeSlot;
//
// 		let appointmentObject = {
// 			Appointments: {
// 				Appointment: {
// 					Location: {
// 						ID: slot.Location.ID
// 					},
// 					Staff: {
// 						ID: slot.Staff.ID
// 					},
// 					Client: {
// 						ID: customer.ID
// 					},
// 					SessionType: {
// 						ID: slot.SessionType.ID
// 					},
// 					StartDateTime: moment(slot.StartDateTime).format('YYYY-MM-DDTHH:mm:ss')
// 				}
// 			},
// 			UpdateAction: "AddNew"
// 		};
// 		self.mindbodyLogic.bookAppointment(appointmentObject).then(function (result) {
// 			console.log(result);
// 			callback(facebookResponse.getTextMessage("Booked successfully for " + customer.FirstName + " " + customer.LastName));
// 		}).catch(function (err) {
// 			if (err.errorReason) {
// 				callback(facebookResponse.getTextMessage(err.errorReason));
// 			} else {
// 				callback(facebookResponse.getTextMessage("Try to book for " + customer.FirstName));
// 			}
// 		});
// 	});
// };


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
AppointmentLogic.prototype.sendPromotions = async function (conversationData, reply) {
	let self = this;
	let user = self.user;

	try {

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
			let appointmentTypes = await acuityLogic.getAppointmentTypes();

			let options = {
				appointmentTypeID: appointmentTypes[0].id,
				date: moment().tz(user.integrations.Acuity.userDetails.timezone).add(1, 'days').format('YYYY-MM-DDTHH:mm:ss')
			};

			//get slots
			let slots = await acuityLogic.getAvailability(options);

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

				let firstText = " noticed that you have " + slots.length + " openings on your calendars tomorrow.";
				if (!conversationData.skipHey) {
					firstText = "Hey boss, I" + firstText;
				} else {
					firstText = "I also" + firstText;
				}

				async.series([
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage(firstText), true),
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("I can help you fill the openings by promoting to your customers"), true, delayTime),
					MyUtils.resolveMessage(reply, lastQRResponse, false, delayTime),
				], MyUtils.getErrorMsg());

			});
		}
		else if (lastQuestionId === sendPromotionsQuestions.toPromote.id) {

			if (conversationData.payload) {

				if (conversationData.payload.id == 1) {

					//ask which service
					let question = sendPromotionsQuestions.serviceName;
					//save conversation to the user
					user.conversationData = conversationData;
					//save the service question
					user.conversationData.lastQuestion = question;
					//save next question state
					user.conversationData.nextAnswerState = "text";

					//save the user
					self.DBManager.saveUser(user).then(function () {

						//send messages
						async.series([
							MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Great! 😊"), true),
							MyUtils.resolveMessage(reply, facebookResponse.getTextMessage(question.text), false, delayTime),
						], MyUtils.getErrorMsg());

					});
				} else {

					user.conversationData = null;
					user.session = null;

					//save the user
					self.DBManager.saveUser(user).then(function () {
						reply(facebookResponse.getTextMessage("I'll be right here if you need me ☺"), false);
					});
				}
			} else {
				//send qr again
				async.series([
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Let's finish what we started"), true),
					MyUtils.resolveMessage(reply, user.conversationData.lastQRResponse, false, delayTime),
				], MyUtils.getErrorMsg());
			}
		}
		else if (lastQuestionId === sendPromotionsQuestions.serviceName.id) {

			//get the service list
			let appointmentTypes = await acuityLogic.getAppointmentTypes();

			//init the session
			user.session = {};

			//get the service by the user input
			let service = MyUtils.getSimilarityFromArray(conversationData.input, appointmentTypes, 'name');
			user.session[user.conversationData.lastQuestion.field] = service;

			//ask for template
			let currentQuestion = sendPromotionsQuestions.whichTemplate;
			//set current question
			user.conversationData.lastQuestion = currentQuestion;
			user.conversationData.nextAnswerState = "payload";

			//save the user
			await self.DBManager.saveUser(user);

			//send messages
			async.series([
				MyUtils.resolveMessage(reply, facebookResponse.getTextMessage(currentQuestion.text), true),
				MyUtils.resolveMessage(reply, facebookResponse.getGenericTemplate([
					//coupon
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
					//25% off
					facebookResponse.getGenericElement("25% discount",
						"http://res.cloudinary.com/gotime-systems/image/upload/v1500931267/25p_vahxwh.png",
						"Offer a discount of 25% to selected customers",
						[facebookResponse.getGenericButton("postback", "I like it", {
							id: 2,
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
							id: 3,
							title: "1 + 1",
							zoiCoupon: "Zoi.1Plus1",
							image: "http://res.cloudinary.com/gotime-systems/image/upload/v1500935100/1_1_offer-no-shadow-02_d3klck.png",
							color: "#d1dd25",
							hoverColor: "#c3c62f"
						})])
				]), false, delayTime),
			], MyUtils.getErrorMsg());
		}
		else if (lastQuestionId === sendPromotionsQuestions.whichTemplate.id) {

			//check valid answer
			if (MyUtils.isJson(conversationData.input)) {

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
				await self.DBManager.saveUser(user);

				//send messages
				async.series([
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Great! 😊"), true),
					MyUtils.resolveMessage(reply, user.conversationData.lastQRResponse, false, delayTime),
				], MyUtils.getErrorMsg());
			}

		} else if (lastQuestionId === sendPromotionsQuestions.areYouSure.id) {

			//check valid payload
			if (!conversationData.payload) {
				//send qr again
				async.series([
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Let's finish what we started"), true),
					MyUtils.resolveMessage(reply, user.conversationData.lastQRResponse, false, delayTime),
				], MyUtils.getErrorMsg());
				return;
			}

			if (conversationData.payload && conversationData.payload.answer === "yes") {

				let appointmentType = deepcopy(user.session['service']);
				let template = deepcopy(user.session['template']);

				//get the clients of the business
				let clients = await acuityLogic.getClients();

				//get black list
				let blackList = await self.DBManager.getBlackList({
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

				let daysRange = 7;
				//get appointments in range of a week
				let appointmentsInWeekRange = await acuityLogic.getAppointments({
					minDate: MyUtils.convertToAcuityDate(moment().tz(user.integrations.Acuity.userDetails.timezone).subtract(daysRange, 'days').startOf('day')),
					maxDate: MyUtils.convertToAcuityDate(moment().tz(user.integrations.Acuity.userDetails.timezone).add(daysRange, 'days').endOf('day'))
				});

				//remove clients from black list
				clients = MyUtils.removeClientsExistOnList(blackList, clients, "_id");
				//remove clients from appointments in range of a week
				clients = MyUtils.removeClientsExistOnList(appointmentsInWeekRange, clients, "email");
				//get 25% from the left customers
				clients = MyUtils.getRandomFromArray(clients, (clients.length / ZoiConfig.generalPromotionDeviation).toFixed(0));

				//iterate clients
				clients.forEach(function (client) {

					if (!client.email) {
						return;
					}

					//send single email every loop
					let emailList = [{
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
					emailHtml = MyUtils.replaceAll('{{unsubscribeHref}}', ZoiConfig.serverUrl + "/unsubscribe?email=" + client.email, emailHtml);

					//set href
					let appointmentParams = {
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
					let iWantUrl = MyUtils.addParamsToUrl(ZoiConfig.clientUrl + '/appointment-sum', appointmentParams).replace("%", "%25");
					emailHtml = emailHtml.replace('{{href}}', iWantUrl);

					//send the email to the client
					EmailLib.sendEmail(emailHtml, emailList);

					let blockRange = user.customerSendLimit && user.customerSendLimit.value ? user.customerSendLimit.value : 7;

					//unsubscribe this email for X days(do it async)
					self.DBManager.addEmailToUnsubscribe({
						_id: client.email,
						blockDate: moment().tz(user.integrations.Acuity.userDetails.timezone).add(blockRange, 'days').valueOf(),
						blockDateString: moment().tz(user.integrations.Acuity.userDetails.timezone).add(blockRange, 'days').format('lll')
					});
				});

				//save promotion times
				let actionTime = moment().tz(user.integrations.Acuity.userDetails.timezone).format("YYYY/MM");
				if (user.profile[actionTime]) {
					user.profile[actionTime].numOfPromotions = (user.profile[actionTime].numOfPromotions || 0) + 1;
				} else {
					user.profile[actionTime] = {
						numOfPromotions: 1
					}
				}

				//clear the session and the conversation data
				self.clearSession();

				//send messages
				async.series([
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("I'm super excited!!! I'll send it right away. 👏"), true),
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Done! 😎 I sent the promotion to " + clients.length + " of your customers."), true, delayTime),
					MyUtils.resolveMessage(reply, facebookResponse.getTextMessage("Your calendar is going to be full in no time"), false, delayTime),
				], MyUtils.getErrorMsg());
			} else {
				self.clearSession();
				reply(facebookResponse.getTextMessage("Ok boss"));
			}
		}
	} catch (err) {
		MyLog.error(err);
		MyLog.error("Error on send promotions. userId => " + user._id);
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
		MyLog.log("conversation cleared!");
	});
};

module.exports = AppointmentLogic;