const sinon = require('sinon');
const chai = require('chai');
const expect = require('chai').expect;
const deepcopy = require('deepcopy');
const assert = require('assert');
const MyUtils = require('../interfaces/utils');
const RssLogic = require('../logic/RssLogic');

describe("RssLogic Class", () => {


	it("get open graph results", async () => {

		const urlTest = "https://www.nytimes.com/guides/well/guide-to-modern-parenting";

		const articleResult = await RssLogic.getOpenGraphResult(urlTest);

		//check image exist
		assert(articleResult.ogImage.url.length > 0);
	});

	it("get random article", async () => {

		const articleResult = await RssLogic.getRandomArticles("nail", ["nails"], 4);

		assert(articleResult);

		//check image exist
		articleResult.forEach((article) => {
			assert(article.image);
			expect(article.tag === "nail");
		});
	});

});