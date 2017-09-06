const sinon = require('sinon');
const chai = require('chai');
const expect = require('chai').expect;
const deepcopy = require('deepcopy');
const assert = require('assert');
const MyLog = require('../interfaces/MyLog');

const mockSlots = [
	{time: "13:20"},
	{time: "13:40"},
	{time: "14:00"}
];

const mockAppointmentTypes = [
	{id: 1, name: "TRX"},
	{id: 2, name: "Personal Trainer"}
];

const mockUser = {
	"_id": "1651444801564063",
	"conversationData": null,
	"fullname": "Yair Cohen",
	"isOnBoarded": true,
	"profile": {},
	"metadata": {},
	"integrations": {
		"Acuity": {
			"userDetails": {
				"timezone": "Asia/Jerusalem",
				"accessToken": "4MURTnMVGM8Xd3PWjf8LEfXzTVXn1wFg2OL1Gi13"
			},
			"accessToken": "4MURTnMVGM8Xd3PWjf8LEfXzTVXn1wFg2OL1Gi13"
		}
	},
	"session": null,
	"timezone": "Asia/Jerusalem"
};

let DBManager, AppointmentLogic, user, APPOINTMENT_TYPES, SLOTS;
describe('AppointmentLogic Class', function () {

	//prepare before all the tests running
	before(() => {
		AppointmentLogic = require('../logic/Intents/AppointmentLogic');
		DBManager = require('../dal/DBManager');
	});

	let saveUserStubbed, getUserStubbed;
	beforeEach(() => {
		saveUserStubbed = sinon.stub(DBManager, "saveUser");
		getUserStubbed = sinon.stub(DBManager, "getUser");
		user = deepcopy(mockUser);
		APPOINTMENT_TYPES = deepcopy(mockAppointmentTypes);
		SLOTS = deepcopy(mockSlots);
	});

	afterEach(() => {
		saveUserStubbed.restore();
		getUserStubbed.restore();
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

			appointmentLogic.askForServiceOrText = sinon.stub();

			appointmentLogic.sendMessages = fakeSendMessagesFunction(appointmentLogic);

			await appointmentLogic.startPromotionsConvo();

			assert(appointmentLogic.askForServiceOrText.called);
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
			assert(appointmentLogic.sendMessages.called);
			assert(saveUserStubbed.called);
		});

		it("check when slot doesn't exist", async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 2}};
			const appointmentLogic = new AppointmentLogic(user, {});

			mockCommonFunctions(appointmentLogic, []);

			const result = await appointmentLogic.askForPromotion();

			expect(result).to.equals("ThereAreNoOpenSlots - userOnBoarded");
			assert(appointmentLogic.sendMessages.called);
			assert(saveUserStubbed.called);
		});

		it("check when slot doesn't exist and user not onboarded", async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 2}};
			user.isOnBoarded = false;
			const appointmentLogic = new AppointmentLogic(user, {});

			mockCommonFunctions(appointmentLogic, []);

			const result = await appointmentLogic.askForPromotion();

			expect(result).to.equals("ThereAreNoOpenSlots - userNotOnBoarded");
			assert(appointmentLogic.sendMessages.called);
			assert(saveUserStubbed.called);
		});

	});

	//test 'ask for service name'
	describe('askForServiceOrText function', function () {
		it("check that the user said he wants promotion via email and he gets the services", async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 3}};
			user.isOnBoarded = false;
			const appointmentLogic = new AppointmentLogic(user, {
				payload: {
					id: "emailPromotion"
				}
			});

			mockCommonFunctions(appointmentLogic, SLOTS);

			const result = await appointmentLogic.askForServiceOrText();

			expect(result).to.equals("userGotServicesList");
			assert(appointmentLogic.sendMessages.called);
			assert(saveUserStubbed.called);
		});

		it("check that the user said he wants promotion via facebook post and he gets the services", async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 3}};
			user.isOnBoarded = false;
			const appointmentLogic = new AppointmentLogic(user, {
				payload: {
					id: "postOnFacebook"
				}
			});

			mockCommonFunctions(appointmentLogic, SLOTS);

			const result = await appointmentLogic.askForServiceOrText();

			expect(result).to.equals("userAskedForPostText");
			assert(appointmentLogic.sendMessages.called);
			assert(saveUserStubbed.called);
		});

		it("if user refuses to send promotion", async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 3}};
			const appointmentLogic = new AppointmentLogic(user, {
				payload: {
					id: "dontPromote"
				}
			});

			mockCommonFunctions(appointmentLogic, SLOTS);

			const result = await appointmentLogic.askForServiceOrText();

			expect(result).to.equals("userQuitPromotionProcess");
			assert(appointmentLogic.sendMessages.called);
			assert(saveUserStubbed.called);
		});

		it("if user refuses to send promotion(by 'No' button) and he is not onboarded", async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 3}};
			user.isOnBoarded = false;
			const appointmentLogic = new AppointmentLogic(user, {
				payload: {
					id: "dontPromote"
				}
			});

			mockCommonFunctions(appointmentLogic, SLOTS);

			const result = await appointmentLogic.askForServiceOrText();

			expect(result).to.equals("userQuitPromotionProcess - finishOnBoarding");
			assert(appointmentLogic.checkAndFinishOnBoarding.called);
		});

		it("if user didn't press on button", async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 3}};
			user.isOnBoarded = false;
			const appointmentLogic = new AppointmentLogic(user, {});

			mockCommonFunctions(appointmentLogic, SLOTS);

			const result = await appointmentLogic.askForServiceOrText();

			expect(result).to.equals("sendPromotionsQuestionAgain");
			assert(appointmentLogic.sendMessages.called);
		});
	});

	//test 'ask for template'
	describe('askForTemplate function', function () {

		it("check that the user got template after he chose service", async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 4}};
			const appointmentLogic = new AppointmentLogic(user, {
				payload: {}
			});

			mockCommonFunctions(appointmentLogic, SLOTS);

			const result = await appointmentLogic.askForTemplate();

			expect(result).to.equals("userGotTemplateList");
			assert(appointmentLogic.sendMessages.called);
			assert(saveUserStubbed.called);
		});

		it("check that services send again when user didn't chose any service", async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 4}};
			const appointmentLogic = new AppointmentLogic(user, {});

			mockCommonFunctions(appointmentLogic, SLOTS);

			const result = await appointmentLogic.askForTemplate();

			expect(result).to.equals("sendServicesAgain");
			assert(appointmentLogic.sendMessages.called);
		});
	});

	//test 'ask for post image'
	describe('askForPostImage function', function () {
		it("check that services send again when user didn't chose any service", async function () {

			const postText = "someText";

			//set last question
			user.conversationData = {lastQuestion: {id: "askForPostText", field: "postText"}};
			const appointmentLogic = new AppointmentLogic(user, {input: postText});

			mockCommonFunctions(appointmentLogic, SLOTS);

			const result = await appointmentLogic.askForPostImage();

			expect(result).to.equals("userAskedForPostImage");
			expect(user.session.postText).to.equals(postText);
			assert(appointmentLogic.sendMessages.called);
		});
	});


	//test 'ask for confirmation'
	describe('askForPromotionConfirmation function', function () {

		it("check that the user got confirmation message after he chose template", async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 5, field: "template"}};
			user.session = {template: {}, service: {name: "haha"}};
			const appointmentLogic = new AppointmentLogic(user, {input: "{}"});//function looks for valid json to the template

			mockCommonFunctions(appointmentLogic, SLOTS);

			const result = await appointmentLogic.askForPromotionConfirmation();

			expect(result).to.equals("userGotConfirmationMessage");
			assert(appointmentLogic.sendMessages.called);
			assert(saveUserStubbed.called);
		});

		it("check that templates send again when user didn't chose any template", async function () {

			//set last question
			user.conversationData = {lastQuestion: {id: 5}};
			const appointmentLogic = new AppointmentLogic(user, {input: "I want the 1+1"});

			mockCommonFunctions(appointmentLogic, SLOTS);

			const result = await appointmentLogic.askForPromotionConfirmation();

			expect(result).to.equals("askForTemplateAgain");
			assert(appointmentLogic.sendMessages.called);
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

			expect(onBoardedTestResult.functionReturnValue).to.equals("promotionSent");
			assert(onBoardedTestResult.sendEmailToClient.called);
			assert(onBoardedTestResult.getAppointments.called);
			assert(onBoardedTestResult.getClients.called);
			assert(saveUserStubbed.called);
		});

		it("check that after the user said he confirm the promotion - the promotion has been sent and proceed to onboarding(the user not onboarded)", async function () {

			const notOnBoardedTestResult = await sendPromotionToUserTestFunction(false);

			expect(notOnBoardedTestResult.functionReturnValue).to.equals("promotionSent - proceed with onboarding");
			assert(notOnBoardedTestResult.sendEmailToClient.called);
			assert(notOnBoardedTestResult.getAppointments.called);
			assert(notOnBoardedTestResult.getClients.called);
			assert(saveUserStubbed.called);
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
			const getClients = sinon.stub(appointmentLogic.acuityLogic, "getClients").callsFake(function () {
				MyLog.log("got clients");
				return [{
					email: "yairco1990@gmail.com",
					firstName: "YairTest",
					lastName: "CohenTest"
				}];
			});

			//mock get appointments function
			const getAppointments = sinon.stub(appointmentLogic.acuityLogic, "getAppointments").callsFake(function () {
				MyLog.log("got appointments");
				return [];
			});

			const sendEmailToClient = sinon.stub(appointmentLogic, "sendEmailToClient").callsFake(function (user) {
				MyLog.log(`send email to ${user.firstName} ${user.lastName} ${user.email}`);
			});

			const functionReturnValue = await appointmentLogic.sendPromotionToUsers();

			return {
				functionReturnValue, sendEmailToClient, getAppointments, getClients, appointmentLogic, user
			};
		}
	});
});

/**
 * mock common function
 * @param appointmentLogic - the instance we created
 * @param slots - can be changed from test to test
 */
function mockCommonFunctions(appointmentLogic, slots) {
	return {
		sendMessages: fakeSendMessagesFunction(appointmentLogic),
		getAppointmentTypes: fakeGetAppointmentTypesFunction(appointmentLogic, APPOINTMENT_TYPES),
		getAvailability: fakeGetAvailabilityFunction(appointmentLogic, slots),
		checkAndFinishOnBoarding: fakeCheckAndFinishOnBoardingFunction(appointmentLogic)
	};
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


