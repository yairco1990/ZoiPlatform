const sinon = require('sinon');
const chai = require('chai');
const expect = require('chai').expect;
const deepcopy = require('deepcopy');
const assert = require('assert');
const MyUtils = require('../interfaces/utils');
const LinkShortnerLogic = require('../logic/LinkShortnerLogic');

describe("LinkShortner Class", () => {

	it.only("save and get link", async () => {

		const TEST_LINK = "http://www.walla.co.il";

		const savedLinkId = await LinkShortnerLogic.saveLink(TEST_LINK);

		const linkFromDB = await LinkShortnerLogic.getLink(savedLinkId);

		expect(linkFromDB).to.equals(TEST_LINK);

	});

});