const FacebookLogic = require('../logic/FacebookLogic');
const MyUtils = require('../interfaces/utils');
const expect = require('chai').expect;


describe("test facebook graph api", () => {

	//get valid params from DB
	const facebookPageId = "343185779443065";
	const facebookPageAccessToken = "EAAFGPKITtcEBAHgGOiPKqZC5MhalJOhKx1ztJcgUFBPGUi31FlA8JM2dUc1WzIckwGjD1tVyZBPd4ZCen9d0OGaHZAhFuJngtqtFipYDuyaccStGulefZCLoaqDYcD2SoePwQNE6hQj0ZCRSUsZAqfr8ZChJeikBM2mkC6k3HhUf9QZDZD";

	it.skip("upload a photo with text to facebook page", async () => {

		//get page id and access token from DB
		const imageUrl = "https://scontent-frx5-1.xx.fbcdn.net/v/t35.0-12/21439220_10156212561169528_1395213539_o.jpg?_nc_ad=z-m&oh=d7218820fd3eb45e3491d0d9f9e497e4&oe=59B088D8";
		const message = MyUtils.generateRandomString(100, true);

		let response = await FacebookLogic.postPhotoOnFacebookPage(facebookPageId, {
			access_token: facebookPageAccessToken,
			message: message,
			url: imageUrl
		});

		expect(response.postId).to.includes(facebookPageId);
		// console.log(response);
	});

	it.skip("post a link with message to facebook page", async () => {

		let response = await FacebookLogic.postContentOnFacebookPage(facebookPageId, {
			access_token: facebookPageAccessToken,
			message: "You should read this!",
			link: "https://l.facebook.com/l.php?u=http%3A%2F%2Fwww.beautyworldnews.com%2Farticles%2F19167%2F20170329%2Ffirst-look-of-new-jumanji-movie-starring-dwayne-johnson-revealed.htm&h=ATPYcXw4_fGL5qie967HX_Q7jz7qX9CPtOj5_mO4ZCwFjxmVGhpyD0WqBCK2sHZ6pAcwooVw5rErUJsTLGcDTpHhDcHHu-xnbjIk_JXz9gNER0HtQomVWy7PceJ54gI"
		});

		expect(response.id).to.includes(facebookPageId);

	});
});