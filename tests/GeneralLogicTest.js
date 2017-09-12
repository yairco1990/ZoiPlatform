const TestHelper = require('./TestHelper');
const sinon = require('sinon');
const chai = require('chai');
const expect = require('chai').expect;
const deepcopy = require('deepcopy');
const assert = require('assert');
const MyLog = require('../interfaces/MyLog');
const ZoiConfig = require('../config');

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
	"timezone": "Asia/Jerusalem",
	categories: "nail",
	keyWords: ["nails"],
};

let DBManager, RssLogic, GeneralLogic, user;

describe('GeneralLogic Class', function () {

	before(() => {
		GeneralLogic = require('../logic/Intents/GeneralLogic');
		DBManager = require('../dal/DBManager');
		RssLogic = require('../logic/RssLogic');
	});

	let saveUserStubbed, getUserStubbed, getRandomArticleStubbed;
	beforeEach(() => {
		saveUserStubbed = sinon.stub(DBManager, "saveUser");
		getUserStubbed = sinon.stub(DBManager, "getUser");
		//stub get random article
		getRandomArticleStubbed = sinon.stub(RssLogic, "getRandomArticles").callsFake(function () {
			return [{
				title: "testTitle",
				image: "testImage",
				description: "testDescription",
				link: "testLink"
			}];
		});
		user = deepcopy(mockUser);
	});

	afterEach(() => {
		saveUserStubbed.restore();
		getUserStubbed.restore();
		getRandomArticleStubbed.restore();
	});

	//test get appointment function
	describe('suggestRandomArticle function', function () {
		it('check success', async function () {

			const generalLogic = new GeneralLogic(user, {});

			TestHelper.fakeSendMessagesFunction(generalLogic);

			const result = await generalLogic.suggestRandomArticle();

			expect(result).to.equals("success");
		});
	});
});
