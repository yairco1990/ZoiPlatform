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
const deepcopy = require('deepcopy');

const delayTime = 3000;

function AppointmentLogic() {
	//get the single instance of DBManager
	this.DBManager = require('../../dal/DBManager');
	this.mindbodyLogic = new MindbodyLogic({});
}

/**
 * process the user input
 */
AppointmentLogic.prototype.processIntent = function (conversationData, user, setBotTyping, requestObj, callback) {
	let self = this;

	switch (conversationData.intent) {
		case "appointment what is my schedule":
			self.getAppointments(user, conversationData, callback);
			break;
		case "appointment bring next free slot":
			setBotTyping();
			self.getNextFreeSlot(user, conversationData, callback);
			break;
		case "appointment book for customer":
			setBotTyping();
			self.bookForCustomer(user, conversationData, callback);
			break;
		case "appointment send promotions":
			setBotTyping();
			self.sendPromotions(user, conversationData, callback);
			break;
	}
};

/**
 * get appointments
 */
AppointmentLogic.prototype.getAppointments = function (user, conversationData, callback) {
	let self = this;

	callback(facebookResponse.getTextMessage("Let me see..."), true);

	setTimeout(function () {

		callback(facebookResponse.getButtonMessage("This is your schedule for today sir:", [
			facebookResponse.getGenericButton("web_url", "Watch your schedule", null, "http://zoiai.com/#/agenda", "tall")
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
AppointmentLogic.prototype.getNextFreeSlot = function (user, conversationData, callback) {
	let self = this;

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
 * @param user
 * @param conversationData
 * @param callback
 */
AppointmentLogic.prototype.bookForCustomer = function (user, conversationData, callback) {
	let self = this;

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
		text: "Which service you like to promote?",
		field: "service"
	},
	whichTemplate: {
		id: 2,
		text: "I made 3 options, feel free to choose the one you like:",
		field: "template"
	},
	areYouSure: {
		id: 3,
		text: "Are you sure you want to send promotions to service {serviceName}?"
	}
};

/**
 * send promotions
 */
AppointmentLogic.prototype.sendPromotions = function (user, conversationData, callback) {
	let self = this;

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
			//save the user
			self.DBManager.saveUser(user).then(function () {
				setTimeout(function () {
					callback(facebookResponse.getTextMessage("Hey boss, I noticed that you have " + slots.length + " openings in your calendars tomorrow."), true);

					setTimeout(function () {
						callback(facebookResponse.getTextMessage("I can promote them for you."), true);

						setTimeout(function () {
							callback(facebookResponse.getQRElement("What do you want me to do?",
								[
									facebookResponse.getQRButton('text', 'Email Promotion', {id: 1}),
									facebookResponse.getQRButton('text', 'No Thank\'s', {id: 2})
								]
							))
						}, delayTime);
					}, delayTime);
				}, delayTime);
			});
		});
	}
	else if (lastQuestionId === sendPromotionsQuestions.toPromote.id) {

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
				callback(facebookResponse.getTextMessage(question.text));
			});
		} else {
			user.conversationData = null;
			user.session = null;

			//save the user
			self.DBManager.saveUser(user).then(function () {
				callback(facebookResponse.getTextMessage("Ok boss.."));
			});
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

				callback(facebookResponse.getTextMessage(currentQuestion.text));

				callback(facebookResponse.getGenericTemplate([
					facebookResponse.getGenericElement("A day in a spa for 100$",
						"http://alluredayspavi.com/portals/_default/Skins/Vaspan/images/BoxImgB1.jpg",
						"Book now for a whole day in our spa for just 100$. Don\'t miss it!",
						[facebookResponse.getGenericButton("postback", "I like it", {id: 1, title: "20% Off!!", zoiCoupon: "Zoi.20PrecentOff"})]),
					facebookResponse.getGenericElement("20% off massage treatments",
						"https://preview.ibb.co/fX8mhv/spa1.jpg",
						"Book a massage now and get 20% off",
						[facebookResponse.getGenericButton("postback", "I like it", {id: 2, title: "1 + 1", zoiCoupon: "Zoi.1Plus1"})]),
					facebookResponse.getGenericElement("1 + 1 on face treatments",
						"https://image.ibb.co/fv5XNv/spa3.jpg",
						"Get 2 treatments for the price of one. Book now to claim your reward",
						[facebookResponse.getGenericButton("postback", "I like it", {id: 3, title: "20$ coupon", zoiCoupon:"Zoi.20DollarCoupon"})])
				]));
			});
		});
	} else if (lastQuestionId === sendPromotionsQuestions.whichTemplate.id) {

		//get the template
		let template = JSON.parse(conversationData.input);
		user.session[user.conversationData.lastQuestion.field] = template;

		//ask if he is sure
		let currentQuestion = sendPromotionsQuestions.areYouSure;
		let responseText = currentQuestion.text;
		responseText = responseText.replace('{serviceName}', user.session['service'].name);

		//set current question
		user.conversationData.lastQuestion = currentQuestion;
		//save the user
		self.DBManager.saveUser(user).then(function () {
			callback(facebookResponse.getQRElement(responseText, [
				facebookResponse.getQRButton("text", "Yes, send it.", {answer: "yes"}),
				facebookResponse.getQRButton("text", "No, don't send it.", {answer: "no"})
			]));
		});

	} else if (lastQuestionId === sendPromotionsQuestions.areYouSure.id) {

		if (conversationData.payload && conversationData.payload.answer == "yes") {

			let appointmentType = user.session['service'];
			let template = user.session['template'];

			let emailFile;

			let options = {
				appointmentTypeID: appointmentType.id,
				date: moment().add(1, 'days').format('YYYY-MM-DDTHH:mm:ss')
			};

			acuityLogic.getAvailability(options).then(function (slots) {

				//get the clients of the business
				acuityLogic.getClients().then(function (clients) {

					EmailLib.getEmailFile(__dirname + "/../../interfaces/assets/scheduleButton.html").then(function (scheduleButton) {

						//iterate clients
						clients.forEach(function (client) {

							//transform slot to appointment scheduling button
							let scheduleButtonsHtml = "";

							let appointmentParams = {
								firstname: client.firstName,
								lastname: client.lastName,
								email: client.email,
								ownerId: user._id,
								serviceId: appointmentType.id,
								serviceName: appointmentType.name,
								notes: template.zoiCoupon
							};

							//choose 5 slots
							let slotsCopy = deepcopy(slots);
							slotsCopy = slotsCopy.slice(0, 5);
							//iterate slots
							slotsCopy.forEach(function (slot) {
								//create slot button
								let formattedScheduleButton = deepcopy(scheduleButton);
								appointmentParams.date = slot.time;
								formattedScheduleButton = formattedScheduleButton.replace('{{href}}', MyUtils.addParamsToUrl('http://localhost:63343/ZoiClient/index.html#/appointment-sum', appointmentParams));
								formattedScheduleButton = formattedScheduleButton.replace('{{appointmentTime}}', moment(slot.time).format('HH:mm MM.DD'));
								scheduleButtonsHtml += formattedScheduleButton + "\n";
							});

							//send single email every loop
							let emailList = [{
								address: client.email,
								from: 'Zoi.AI <noreply@fobi.io>',
								subject: 'Test Subject',
								alt: 'Test Alt'
							}];

							//send email function
							let sendEmail = function (emailFile) {
								emailFile = emailFile.replace('{{scheduleButtons}}', scheduleButtonsHtml);
								emailFile = emailFile.replace('{{title}}', template.title);
								//send the email to the list
								EmailLib.sendEmail(emailFile, emailList);
							};

							//check if we already got the email file
							if (!emailFile) {
								//get email file
								EmailLib.getEmailFile(__dirname + "/../../interfaces/assets/promotionsMail.html").then(function (emailHtml) {
									emailFile = emailHtml;
									sendEmail(emailFile);
								});
							} else {
								sendEmail(emailFile)
							}
						});


						callback(facebookResponse.getTextMessage("Great, I will send it right now. 👍"));
						setTimeout(function () {
							callback(facebookResponse.getTextMessage("Done! I sent the promotion to " + clients.length + " customers. 🙂"));
							setTimeout(function () {
								callback(facebookResponse.getTextMessage("Your calendar is going to be full in no time"));
							}, delayTime);
						}, delayTime);

					}).catch(function (err) {
						Util.log("Error:");
						Util.log(err);
					});
				}).catch(function (err) {
					Util.log("Error:");
					Util.log(err);
				});
			});
		} else {
			callback(facebookResponse.getTextMessage("Ok boss"));
		}

		//clear conversation data
		user.conversationData = null;
		self.DBManager.saveUser(user).then(function () {
			Util.log("conversation cleared!");
		});
	}
};

module.exports = AppointmentLogic;