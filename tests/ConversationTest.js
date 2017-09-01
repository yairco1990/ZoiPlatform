// const sinon = require('sinon');
// const chai = require('chai');
// const expect = require('chai').expect;
// const deepcopy = require('deepcopy');
// const assert = require('assert');
// const MyLog = require('../interfaces/MyLog');
// const ZoiConfig = require('../config');
// const User = require('../dal/models/User');
//
// const mockSlots = [
// 	{
// 		time: "13:20"
// 	},
// 	{
// 		time: "13:40"
// 	},
// 	{
// 		time: "14:00"
// 	}
// ];
//
// const mockAppointmentTypes = [
// 	{
// 		id: 1,
// 		name: "TRX"
// 	},
// 	{
// 		id: 2,
// 		name: "Personal Trainer"
// 	}
// ];
//
// let listenLogic;
// let appointmentTypes, slots;
// describe('Check conversations', function () {
//
// 	const startedUser = {id: "1651444801564063"};
//
// 	//prepare before all the tests running
// 	before(() => {
// 		//disable logs
// 		MyLog.log = () => {
// 		};
//
// 		//connect to test db
// 		ZoiConfig.mongoUrl = 'mongodb://localhost:27017/zoitest_db';
//
// 		listenLogic = new (require('../logic/Listeners/ListenLogic'))();
// 	});
//
// 	beforeEach("deep copy of user before each test", function () {
// 		appointmentTypes = deepcopy(mockAppointmentTypes);
// 		slots = deepcopy(mockSlots);
// 	});
//
// 	describe('Welcome conversation', function () {
// 		it('start the first conversation', async function () {
// 			const response = await listenLogic.processInput(
// 				"resetzoi",
// 				{
// 					sender: {id: startedUser.id}
// 				},
// 				null,
// 				null
// 			);
//
// 			expect(response).to.equals("initNewUserSuccess");
// 		});
//
// 		it("User says let's go!", async function () {
// 			const response = await listenLogic.processInput(
// 				"bla bla",
// 				{
// 					sender: {id: startedUser.id},
// 					message: {
// 						quick_reply: {id: 1}
// 					}
// 				},
// 				null,
// 				null
// 			);
//
// 			expect(response).to.equals("gotIntegrationButton");
// 		});
// 	});
//
//
// 	after(() => {
// 		// User.remove({_id: startedUser.id}, function (err) {
// 		// 	if (err) {
// 		// 		console.error(err);
// 		// 	} else {
// 		// 		console.log("user has been deleted successfully");
// 		// 	}
// 		// });
// 	});
// });
