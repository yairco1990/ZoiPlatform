const sinon = require('sinon');
const chai = require('chai');
const expect = require('chai').expect;
const deepcopy = require('deepcopy');
const assert = require('assert');
const MyLog = require('../interfaces/MyLog');
const ZoiConfig = require('../config');

const mockSlots = [
	{
		time: "13:20"
	},
	{
		time: "13:40"
	},
	{
		time: "14:00"
	}
];

const mockAppointmentTypes = [
	{
		id: 1,
		name: "TRX"
	},
	{
		id: 2,
		name: "Personal Trainer"
	}
];

const mockUser = {
	"_id": "1651444801564063",
	"__v": 0,
	"wishList": [],
	"conversationData": null,
	"fullname": "Yair Cohen",
	"lastMessageTime": 1503883336524,
	"oldCustomersRange": {
		"text": "1 month",
		"value": 30
	},
	"customerSendLimit": {
		"text": "1 promo per week",
		"value": 7
	},
	"promptNewCustomers": true,
	"defaultCalendar": {
		"id": -1,
		"name": "All calendars"
	},
	"morningBriefTime": "09:00",
	"isOnBoarded": true,
	"nextOldCustomersDate": 1503997255206,
	"nextMorningBriefDate": 1503986455205,
	"startedAt": "August 28th 2017",
	"profile": {},
	"metadata": {},
	"integrations": {
		"Acuity": {
			"userDetails": {
				"id": 13928644,
				"email": "yairco1990@gmail.com",
				"timezone": "Asia/Jerusalem",
				"firstDayOfWeek": 0,
				"timeFormat": "ampm",
				"currency": "ILS",
				"schedulingPage": "https://app.acuityscheduling.com/schedule.php?owner=13928644",
				"embedCode": "<iframe src=\"https://app.acuityscheduling.com/schedule.php?owner=13928644\" width=\"100%\" height=\"800\" frameBorder=\"0\"><\/iframe>\n<script src=\"https://d3gxy7nm8y4yjr.cloudfront.net/js/embed.js\" type=\"text/javascript\"><\/script>",
				"plan": "Free",
				"name": "Yair's Spa",
				"description": "",
				"isHIPAA": false,
				"cardPayments": false,
				"clientsDistinctByPhone": false,
				"accessToken": "4MURTnMVGM8Xd3PWjf8LEfXzTVXn1wFg2OL1Gi13"
			},
			"accessToken": "4MURTnMVGM8Xd3PWjf8LEfXzTVXn1wFg2OL1Gi13"
		}
	},
	"session": null,
	"timezone": "Asia/Jerusalem"
};

let AppointmentLogic, user, APPOINTMENT_TYPES, SLOTS;
describe('AppointmentLogic Class', function () {

	//prepare before all the tests running
	before(() => {

		//disable logs
		// MyLog.log = () => {
		// };
		//
		// MyLog.info = () => {
		// };
		//
		// MyLog.debug = () => {
		// };

		//connect to test db
		ZoiConfig.mongoUrl = 'mongodb://localhost:27017/zoitest_db';

		AppointmentLogic = require('../logic/Intents/AppointmentLogic');

		let DBManager = require('../dal/DBManager');
		DBManager = {
			saveUser: function () {
				MyLog.log("User Saved");
			},
			getUser: function () {
				MyLog.log("Got User");
			}
		}
	});

	beforeEach("deep copy of user before each test", function () {
		user = deepcopy(mockUser);
		APPOINTMENT_TYPES = deepcopy(mockAppointmentTypes);
		SLOTS = deepcopy(mockSlots);
	});

	//test get appointment function
	describe('getAppointment function', function () {
		it('check success', async function () {

			const appointmentLogic = new AppointmentLogic(user);

			appointmentLogic.sendMessages = fakeSendMessagesFunction(appointmentLogic);

			const result = await appointmentLogic.getAppointments();

			expect(result).to.equals("success");
		});
	});

	//test start promotion conversation
	describe('startPromotionsConvo function', function () {

		it('on conversation starts - ask for send promotion', async function () {

			const appointmentLogic = new AppointmentLogic(user);

			appointmentLogic.askForPromotion = sinon.stub();

			appointmentLogic.sendMessages = fakeSendMessagesFunction(appointmentLogic);

			await appointmentLogic.startPromotionsConvo();

			assert(appointmentLogic.askForPromotion.called);
		});

		it('ask for service', async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 0}};
			const appointmentLogic = new AppointmentLogic(user);

			appointmentLogic.askForService = sinon.stub();

			appointmentLogic.sendMessages = fakeSendMessagesFunction(appointmentLogic);

			await appointmentLogic.startPromotionsConvo();

			assert(appointmentLogic.askForService.called);
		});

		it('ask for template', async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 1}};
			const appointmentLogic = new AppointmentLogic(user);

			appointmentLogic.askForTemplate = sinon.stub();

			appointmentLogic.sendMessages = fakeSendMessagesFunction(appointmentLogic);

			await appointmentLogic.startPromotionsConvo();

			assert(appointmentLogic.askForTemplate.called);
		});

		it('ask for confirmation', async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 2}};
			const appointmentLogic = new AppointmentLogic(user);

			appointmentLogic.askForPromotionConfirmation = sinon.stub();

			mockCommonFunctions(appointmentLogic, SLOTS);

			await appointmentLogic.startPromotionsConvo();

			assert(appointmentLogic.askForPromotionConfirmation.called);
		});
	});

	//test askForPromotion function
	describe('askForPromotion function', function () {

		it('check when slot exist', async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 2}};
			const appointmentLogic = new AppointmentLogic(user, {});

			mockCommonFunctions(appointmentLogic, SLOTS);

			const result = await appointmentLogic.askForPromotion();

			expect(result).to.equals("ThereAreOpenSlots");
		});

		it("check when slot doesn't exist", async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 2}};
			const appointmentLogic = new AppointmentLogic(user, {});

			mockCommonFunctions(appointmentLogic, []);

			const result = await appointmentLogic.askForPromotion();

			expect(result).to.equals("ThereAreNoOpenSlots - userOnBoarded");
		});

		it("check when slot doesn't exist and user not onboarded", async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 2}};
			user.isOnBoarded = false;
			const appointmentLogic = new AppointmentLogic(user, {});

			mockCommonFunctions(appointmentLogic, []);

			const result = await appointmentLogic.askForPromotion();

			expect(result).to.equals("ThereAreNoOpenSlots - userNotOnBoarded");
		});

	});

	//test 'ask for service name'
	describe('askForService function', function () {
		it("check that the user said he wants promotion and he gets the services", async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 3}};
			user.isOnBoarded = false;
			const appointmentLogic = new AppointmentLogic(user, {
				payload: {
					id: 1
				}
			});

			mockCommonFunctions(appointmentLogic, SLOTS);

			const result = await appointmentLogic.askForService();

			expect(result).to.equals("userGotServicesList");
		});

		it("if user refuses to send promotion", async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 3}};
			user.isOnBoarded = true;
			const appointmentLogic = new AppointmentLogic(user, {
				payload: {
					id: 2
				}
			});

			mockCommonFunctions(appointmentLogic, SLOTS);

			const result = await appointmentLogic.askForService();

			expect(result).to.equals("userQuitPromotionProcess");
		});

		it("if user refuses to send promotion(by 'No' button) and he is not onboarded", async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 3}};
			user.isOnBoarded = false;
			const appointmentLogic = new AppointmentLogic(user, {
				payload: {
					id: 2
				}
			});

			mockCommonFunctions(appointmentLogic, SLOTS);

			const result = await appointmentLogic.askForService();

			expect(result).to.equals("userQuitPromotionProcess - finishOnBoarding");
		});

		it("if user didn't press on button", async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 3}};
			user.isOnBoarded = false;
			const appointmentLogic = new AppointmentLogic(user, {});

			mockCommonFunctions(appointmentLogic, SLOTS);

			const result = await appointmentLogic.askForService();

			expect(result).to.equals("sendPromotionsQuestionAgain");
		});
	});

	//test 'ask for template'
	describe('askForTemplate function', function () {

		it("check that the user got template after he chose service", async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 4}};
			user.isOnBoarded = true;
			const appointmentLogic = new AppointmentLogic(user, {
				payload: {}
			});

			mockCommonFunctions(appointmentLogic, SLOTS);

			const result = await appointmentLogic.askForTemplate();

			expect(result).to.equals("userGotTemplateList");
		});

		it("check that services send again when user didn't chose any service", async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 4}};
			user.isOnBoarded = true;
			const appointmentLogic = new AppointmentLogic(user, {});

			mockCommonFunctions(appointmentLogic, SLOTS);

			const result = await appointmentLogic.askForTemplate();

			expect(result).to.equals("sendServicesAgain");
		});
	});


	//test 'ask for confirmation'
	describe('askForPromotionConfirmation function', function () {

		it("check that the user got confirmation message after he chose template", async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 5, field: "template"}};
			user.session = {template: {}, service: {name: "haha"}};
			user.isOnBoarded = true;
			const appointmentLogic = new AppointmentLogic(user, {input: "{}"});//function looks for valid json to the template

			mockCommonFunctions(appointmentLogic, SLOTS);

			const result = await appointmentLogic.askForPromotionConfirmation();

			expect(result).to.equals("userGotConfirmationMessage");
		});

		it("check that templates send again when user didn't chose any template", async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 5}};
			user.isOnBoarded = true;
			const appointmentLogic = new AppointmentLogic(user, {input: "I want the 1+1"});

			mockCommonFunctions(appointmentLogic, SLOTS);

			const result = await appointmentLogic.askForPromotionConfirmation();

			expect(result).to.equals("askForTemplateAgain");
		});
	});


	//test 'send promotion to users'
	describe('sendPromotionToUsers function', function () {

		before(() => {
			const DBManager = require('../dal/DBManager');
			sinon.stub(DBManager, "getBlackList").callsFake(function () {
				MyLog.log("got blackList");
				return [];
			});
		});

		it("check that after the user said he confirm the promotion - the promotion has been sent(the user on boarded)", async function () {

			const onBoardedTestResult = await sendPromotionToUserTestFunction(true);

			expect(onBoardedTestResult).to.equals("promotionSent");
		});

		it("check that after the user said he confirm the promotion - the promotion has been sent and proceed to onboarding(the user not onboarded)", async function () {

			const notOnBoardedTestResult = await sendPromotionToUserTestFunction(false);

			expect(notOnBoardedTestResult).to.equals("promotionSent - proceed with onboarding");
		});

		async function sendPromotionToUserTestFunction(isOnBoarded) {

			//set last question
			user.conversationData = {lastQuestion: {id: 7, field: "template"}};
			user.session = {template: {}, service: {name: "haha"}};
			user.isOnBoarded = isOnBoarded;
			const appointmentLogic = new AppointmentLogic(user, {
				payload: {answer: "yes"}
			});//function looks for valid json to the template

			mockCommonFunctions(appointmentLogic, SLOTS);

			//mock get clients function
			sinon.stub(appointmentLogic.acuityLogic, "getClients").callsFake(function () {
				MyLog.log("got clients");
				return [{
					email: "yairco1990@gmail.com",
					firstName: "YairTest",
					lastName: "CohenTest"
				}];
			});

			//mock get appointments function
			sinon.stub(appointmentLogic.acuityLogic, "getAppointments").callsFake(function () {
				MyLog.log("got appointments");
				return [];
			});

			sinon.stub(appointmentLogic, "sendEmailToClient").callsFake(function (user) {
				MyLog.log(`send email to ${user.firstName} ${user.lastName} ${user.email}`);
			});

			return await appointmentLogic.sendPromotionToUsers();
		}
	});
});

/**
 * mock common function
 * @param appointmentLogic - the instance we created
 * @param slots - can be changed from test to test
 */
function mockCommonFunctions(appointmentLogic, slots) {
	fakeSendMessagesFunction(appointmentLogic);
	fakeGetAppointmentTypesFunction(appointmentLogic, APPOINTMENT_TYPES);
	fakeGetAvailabilityFunction(appointmentLogic, slots);
	fakeCheckAndFinishOnBoardingFunction(appointmentLogic);
}

function fakeSendMessagesFunction(appointmentLogic) {
	return sinon.stub(appointmentLogic, "sendMessages").callsFake(function (messages) {
		MyLog.log(`${messages.length} messages sent`);
	});
}

function fakeGetAppointmentTypesFunction(appointmentLogic, result) {
	return sinon.stub(appointmentLogic.acuityLogic, "getAppointmentTypes").callsFake(function () {
		return result;
	});
}

function fakeGetAvailabilityFunction(appointmentLogic, result) {
	return sinon.stub(appointmentLogic.acuityLogic, "getAvailability").callsFake(function () {
		return result;
	});
}

function fakeCheckAndFinishOnBoardingFunction(appointmentLogic) {
	return sinon.stub(appointmentLogic, "checkAndFinishOnBoarding").callsFake(function () {
		MyLog.log("check user onboarded");
	});
}


