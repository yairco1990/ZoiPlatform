/**
 * Created by Yair on 7/4/2017.
 */
const AcuityApi = require('../ApiHandlers/AcuitySchedulingLogic');
const MyLog = require('../../interfaces/MyLog');
const moment = require('moment-timezone');
const ZoiConfig = require('../../config');
const GmailLogic = require('../GmailLogic');
const _ = require('underscore');
const MyUtils = require('../../interfaces/utils');
const AcuityFactory = require('../../interfaces/Factories/AcuityFactory');
const requestify = require('requestify');
const facebookResponse = require('../../interfaces/FacebookResponse');
const ClientLogic = require('../Intents/ClientLogic');
const EmailLib = require('../../interfaces/EmailLib');
const EmailConfig = require('../../interfaces/assets/EmailsConfig');
const WelcomeLogic = require('../Intents/WelcomeLogic');
const deepcopy = require('deepcopy');
const async = require('async');

const Response = {
	SUCCESS: 200,
	ERROR: 400,
	UNFULLFILLED: 401,
	NOT_FOUND: 404
};

class AcuityLogic {

	constructor() {
		this.DBManager = require('../../dal/DBManager');
	}

	getReplyFunction(bot, user) {
		return function (rep, isBotTyping, delay) {
			return new Promise(function (resolve, reject) {
				delay = delay || 0;
				setTimeout(() => {
					//send reply
					bot.sendMessage(user._id, rep, (err) => {
						if (err) {
							reject(err);
							return;
						}
						if (isBotTyping) {
							bot.sendSenderAction(user._id, "typing_on", () => {
								resolve();
							});
						} else {
							resolve();
						}
						MyLog.log(`Message returned ${user._id}] -> ${rep.text}`);
					});
				}, delay);
			});
		};
	}

	getClients(userId, callback) {
		let self = this;

		self.DBManager.getUser({_id: userId}).then(function (user) {
			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			acuityApi.getClients().then(function (result) {
				callback(Response.SUCCESS, result);
			})
		});
	}

	getAvailability(data, callback) {
		let self = this;

		self.DBManager.getUser({_id: data.userId}).then(function (user) {
			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			let options = {
				appointmentTypeID: parseInt(data.appointmentTypeId),
				date: moment(parseInt(data.date, 16)).tz(user.integrations.Acuity.userDetails.timezone).add(1, 'days').format('YYYY-MM-DDTHH:mm:ss')
			};

			acuityApi.getAvailability(options).then(function (result) {
				callback(Response.SUCCESS, result);
			}).catch(MyUtils.getErrorMsg());
		});
	}

	/**
	 * get business calendars
	 * @param data
	 * @param callback
	 * @returns {Promise.<void>}
	 */
	async getCalendars(data, callback) {
		let self = this;

		try {
			let user = await self.DBManager.getUser({_id: data.userId});

			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			let calendars = await acuityApi.getCalendars();

			callback(Response.SUCCESS, calendars);
		}
		catch (err) {
			callback(Response.ERROR, err);
			console.error(err);
		}
	}

	getAppointmentTypes(userId, callback) {
		let self = this;

		self.DBManager.getUser({_id: userId}).then(function (user) {
			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			acuityApi.getAppointmentTypes().then(function (result) {
				callback(Response.SUCCESS, result);
			})
		});
	}

	//only for test now
	sendPromotions(userId, callback) {
		let self = this;

		self.DBManager.getUser({_id: userId}).then(function (user) {
			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			let options = [
				{key: 'appointmentTypeID', value: 3581890},
				{
					key: 'date',
					value: moment().tz(user.integrations.Acuity.userDetails.timezone).add(1, 'days').format('YYYY-MM-DDTHH:mm:ss')
				}
			];

			return acuityApi.getAvailability(options);
		}).then(function (slots) {

			//iterate slots
			slots.forEach(function (slot) {
				callback(Response.SUCCESS, slot);
			})
		});
	}

	getAgenda(data, callback) {
		let self = this;

		self.DBManager.getUser({_id: data.userId}).then(function (user) {
			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			//check which calendar to use(if valid id - choose it. else - all calendars)
			let calendarId = user.defaultCalendar.id > 0 ? user.defaultCalendar.id : null;

			let params = {
				minDate: MyUtils.convertToAcuityDate(moment().tz(user.integrations.Acuity.userDetails.timezone).startOf('day')),
				maxDate: MyUtils.convertToAcuityDate(moment().tz(user.integrations.Acuity.userDetails.timezone).endOf('day'))
			};

			if (calendarId) {
				params.calendarID = calendarId;
			}

			return acuityApi.getAppointments(params);
		}).then(function (appointments) {

			//sort appointments
			appointments.sort(function (q1, q2) {
				if (moment(q1.datetime).isAfter(moment(q2.datetime))) {
					return 1;
				} else {
					return -1;
				}
			});

			callback(Response.SUCCESS, AcuityFactory.generateAppointmentsList(appointments));
		}).catch(function (err) {
			callback(Response.UNFULLFILLED, err);
		});
	}

	getOldCustomers(data, callback) {
		let self = this;

		self.DBManager.getUser({_id: data.userId}).then(function (user) {

			if (user.metadata.oldCustomers) {
				callback(Response.SUCCESS, user.metadata.oldCustomers);
			} else {
				callback(Response.SUCCESS, "NOT_AVAILABLE");
			}

		}).catch(function (err) {
			callback(Response.UNFULLFILLED, err);
		});
	}

	promoteOldCustomers(bot, data, callback) {
		let self = this;

		let customers = JSON.parse(data.customers);

		let user;
		self.DBManager.getUser({_id: data.userId}).then(function (_user) {
			user = _user;
			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			return acuityApi.getAppointmentTypes();

		}).then(function (appointmentTypes) {

			let emailTemplate = EmailConfig.oldCustomersEmail;
			let service = appointmentTypes[0];

			customers.forEach(function (customer) {

				let emailHtml = EmailLib.getEmailByName('promotionsMail');

				//parse the first part
				emailHtml = emailHtml.replace('{{line1}}', emailTemplate.line1);
				emailHtml = emailHtml.replace('{{line2}}', emailTemplate.line2);
				emailHtml = emailHtml.replace('{{line3}}', emailTemplate.line3);
				emailHtml = emailHtml.replace('{{line4}}', emailTemplate.line4);
				emailHtml = emailHtml.replace('{{bannerSrc}}', emailTemplate.bannerImage);
				emailHtml = emailHtml.replace('{{preHeaderText}}', emailTemplate.subject);

				//parse the second part
				emailHtml = MyUtils.replaceAll('{{business name}}', user.integrations.Acuity.userDetails.name, emailHtml);
				emailHtml = MyUtils.replaceAll('{{firstName}}', customer.firstName, emailHtml);
				emailHtml = MyUtils.replaceAll('{{hoverColor}}', emailTemplate.hoverColor, emailHtml);
				emailHtml = MyUtils.replaceAll('{{color}}', emailTemplate.color, emailHtml);
				emailHtml = MyUtils.replaceAll('{{service}}', service.name, emailHtml);
				emailHtml = MyUtils.replaceAll('{{discount type}}', "10% Off", emailHtml);
				emailHtml = MyUtils.replaceAll('{{href}}', user.integrations.Acuity.userDetails.schedulingPage, emailHtml);
				emailHtml = MyUtils.replaceAll('{{buttonText}}', EmailConfig.oldCustomersEmail.buttonText, emailHtml);
				emailHtml = MyUtils.replaceAll('{{unsubscribeHref}}', ZoiConfig.serverUrl + "/unsubscribe?email=" + customer.email, emailHtml);

				EmailLib.sendEmail(emailHtml, [{
					address: customer.email,
					from: user.integrations.Acuity.userDetails.name + ' <noreply@zoi.ai>',
					subject: EmailConfig.oldCustomersEmail.subject,
					alt: 'Old Customers Promotions',
					replyTo: user.integrations.Acuity.userDetails.email
				}]);
			});

			callback(Response.SUCCESS, "SUCCESS");
			MyLog.log("Old customers promotions sent successfully");

			//remove the metadata
			user.metadata.oldCustomers = null;
			self.DBManager.saveUser(user).then(function () {

				let replyFunction = self.getReplyFunction(bot, user);
				//send messages
				async.series([
					MyUtils.resolveMessage(replyFunction, facebookResponse.getTextMessage("Done! 😎 I sent the promotion to " + customers.length + " of your customers."), true),
					MyUtils.resolveMessage(replyFunction, facebookResponse.getTextMessage("Trust me, they will be regulars soon enough."), false, ZoiConfig.delayTime),
				], MyUtils.getErrorMsg());
			});

		}).catch(function (err) {
			callback(Response.UNFULLFILLED, err);
		});
	}

	scheduleAppointment(data, callback) {
		let self = this;

		let user;
		self.DBManager.getUser({_id: data.userId}).then(function (_user) {
			user = _user;
			let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

			// Create appointment:
			let options = {
				method: 'POST',
				body: {
					//remove the timezone
					datetime: data.datetime.substring(0, 19),
					appointmentTypeID: data.appointmentTypeID,
					firstName: data.firstname,
					lastName: data.lastname,
					email: data.email,
					notes: data.notes
				}
			};
			if (data.certificate) {
				options.body.certificate = data.certificate;
			}

			return acuityApi.scheduleAppointment(options);
		}).then(function () {

			callback(Response.SUCCESS, {});
			MyLog.log("Appointment scheduled successfully");

			//save appointment times
			let actionTime = moment().tz(user.integrations.Acuity.userDetails.timezone).format("YYYY/MM");
			user.profile = user.profile || {};
			if (user.profile[actionTime]) {
				user.profile[actionTime].numOfAppointments = (user.profile[actionTime].numOfAppointments || 0) + 1;
				user.profile[actionTime].profitFromAppointments = ((user.profile[actionTime].profitFromAppointments || 0) + parseFloat(data.price)) || 0;
			} else {
				user.profile[actionTime] = {
					numOfAppointments: 1,
					profitFromAppointments: parseFloat(data.price) || 0
				}
			}

			self.DBManager.saveUser(user).then(function () {
			});
		}).catch(function (err) {

			callback(Response.UNFULLFILLED, err);
		});
	}

	async getEmails(data, callback) {

		let self = this;

		try {
			//get the user
			let user = await self.DBManager.getUser({_id: data.userId});

			if (user.integrations.Gmail) {
				//init the acuity api
				let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

				//get the tokens
				let tokens = user.integrations.Gmail;

				//get user clients
				let clients = await acuityApi.getClients();

				//set the query string
				let queryString = "newer_than:7d is:unread";

				//get unread emails from the user clients
				let messages = await GmailLogic.getEmailsList(tokens, queryString, 'me', user);

				//intersection between user's clients and email messages
				let clientsMessages = _.filter(messages, function (item1) {
					return _.some(this, function (item2) {
						return item1.from.includes(item2.email) && item2.email;
					});
				}, clients);

				callback(Response.SUCCESS, clientsMessages);
			} else { //if there is no integration with Gmail yet

				callback(Response.UNFULLFILLED, "There is no integration with Gmail");
			}

		} catch (err) {
			callback(Response.UNFULLFILLED, err);
		}

	}

	async onAppointmentScheduled(userId, data, bot, callback) {
		let self = this;

		try {
			//get the user that wants to integrate
			let user = await self.DBManager.getUser({_id: userId});

			//if the user prompt new customers
			if (user.promptNewCustomers !== false) {
				let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

				let appointment = await acuityApi.getAppointments(null, 'appointments/' + data.id);

				let options = {
					firstName: appointment.firstName,
					lastName: appointment.lastName
				};

				let appointments = await acuityApi.getAppointments(options);

				if (appointments.length < 2) {

					let newClient = {
						firstName: appointment.firstName,
						lastName: appointment.lastName,
						email: appointment.email,
					};

					if (!user.conversationData) {

						//save the new client to user
						user.session = {
							newClient: newClient
						};
						await self.DBManager.saveUser(user);

						//start the conversation in the clientLogic class
						let clientLogic = new ClientLogic(user);
						let conversationData = {
							intent: "client new customer join",
							context: "CLIENT"
						};
						let replyFunction = self.getReplyFunction(bot, user);
						clientLogic.processIntent(conversationData, null, null, replyFunction);
					}

					callback(Response.SUCCESS, {message: "It's a new customer"});
				} else {
					callback(Response.SUCCESS, {message: "Not a new customer"});
				}
			} else {
				MyLog.info("User doesn't prompt new customers");
				callback(Response.SUCCESS, {message: "User doesn't prompt new customers"});
			}
		} catch (err) {
			MyLog.error("Failed to send welcome message to new customer");
			MyLog.error(err);
			callback(Response.ERROR, err);
		}
	}

	integrate(userId, code, bot, callback) {

		let self = this;

		//get the user that wants to integrate
		self.DBManager.getUser({_id: userId}).then(function (user) {

			//check if already integrated with Acuity
			let isAlreadyConnectedWithAcuity = user.integrations && user.integrations.Acuity;

			//get acuity details
			AcuityApi.getUserAndToken(code).then(function (userData) {

				//set integration
				user.integrations.Acuity = userData;

				//set timezone
				user.timezone = userData.userDetails.timezone;

				//set default values
				user.nextMorningBriefDate = moment().tz(user.timezone).hours(ZoiConfig.times.defaultMorningBriefHours).minutes(0).add(1, 'days').valueOf();
				user.nextOldCustomersDate = moment().tz(user.timezone).hours(ZoiConfig.times.defaultOldCustomersHours).minutes(0).add(1, 'days').valueOf();

				//save user with the integration
				return self.DBManager.saveUser(user);

			}).then(function () {

				//redirect the user to his integrations page
				callback(302, {'location': ZoiConfig.clientUrl + '/integrations?userId=' + userId});

				let acuityApi = new AcuityApi(user.integrations.Acuity.accessToken);

				let targetUrl = ZoiConfig.serverUrl + "/acuity/webhook/" + userId + "/scheduled";
				//register for Acuity webhooks
				let options = {
					method: 'POST',
					body: {
						event: "appointment.scheduled",
						target: targetUrl.replace(":3000", "") //we want to listen on 443 due to Acuity rules
					}
				};
				return acuityApi.setWebhooks(options);

			}).then(function (response) {

				//proceed after user integrated for the first time only(if integrated more than once - skip it)
				if (!isAlreadyConnectedWithAcuity) {

					MyLog.log("Integrated with Acuity successfully");
					MyLog.log(response);
					//save the last message time
					user.lastMessageTime = new Date().valueOf();
					//start the conversation in the welcomeLogic class
					let welcomeLogic = new WelcomeLogic(user);
					let conversationData = {
						intent: "welcome acuity integrated",
						context: "WELCOME"
					};
					let replyFunction = self.getReplyFunction(bot, user);
					welcomeLogic.processIntent(conversationData, null, null, replyFunction);
				} else {
					MyLog.log("Already integrated with Acuity");
				}

			}).catch(MyUtils.getErrorMsg());
		});
	}

	unsubscribe(data, callback) {

		let self = this;

		//unsubscribe for 20 years :)
		let unsubscribeDate = moment().add(20, 'years').valueOf();

		self.DBManager.addEmailToUnsubscribe({_id: data.email, blockDate: unsubscribeDate}).then(function () {
			callback(Response.SUCCESS, "Successfully unsubscribed\n" + data.email);
		});
	}
}

module.exports = AcuityLogic;