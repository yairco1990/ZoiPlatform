const FacebookLogic = require('../logic/FacebookLogic');
const MyUtils = require('../interfaces/utils');
const expect = require('chai').expect;


describe("test facebook graph api", () => {
	it.only("post on facebook page", async () => {

		//get page id and access token from DB
		const facebookPageId = "343185779443065";
		const facebookPageAccessToken = "EAAFGPKITtcEBANHM2qo9ZA58627XcPqNCWPA86yNHuldhiwDZBJN98ib1Uo3dyKvwZAOuumEsk2arHZB4JFayaQPrHVzJkJEfMNhWs2z9qCNMppqNuStPGiZBWXibSSxRfYSB3bSDZAxUOWqLd8Fgj5VwIrzl1KsAgHcGbZB0wklbVlD5EKNMVSxyBZBMpkXRlYZD";
		const imageUrl = "https://scontent-frx5-1.xx.fbcdn.net/v/t35.0-12/21439220_10156212561169528_1395213539_o.jpg?_nc_ad=z-m&oh=d7218820fd3eb45e3491d0d9f9e497e4&oe=59B088D8";
		const message = MyUtils.generateRandomString(100, true);

		let response = await FacebookLogic.postOnFacebookPage(facebookPageId, facebookPageAccessToken, message, imageUrl);

		expect(response.postId).to.includes(facebookPageId);

	})
});