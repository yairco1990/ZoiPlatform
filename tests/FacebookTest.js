const FacebookLogic = require('../logic/FacebookLogic');
const MyUtils = require('../interfaces/utils');
const expect = require('chai').expect;


describe("test facebook graph api", () => {

	//get valid params from DB
	const facebookPageId = "343185779443065";
	const facebookPageAccessToken = "EAAFGPKITtcEBAG9uZBjc50zQj1gsggAHZBcy4Ge8zgFK8Nk65s4FboiHMosH8199qRZCgZC9h3LTlIXzj7EK8cDCaEG7VgJpZBHf2PIPdlqe9sZA0WBH5uJVXjUB22tebR3DVUftCCZAZBSf9dMNE7TPZBS9TARJKAdVNT8KeYmbZAywZDZD";

	it.only("upload a photo with text to facebook page", async () => {

		const imageUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTi3X9F-vgjgBXtiWKmf_c7vJQH49-vkEvwSK_fH1OcvGaDORWs";
		const message = MyUtils.generateRandomString(100, true);

		let response = await FacebookLogic.postPhotoOnFacebookPage(facebookPageId, {
			access_token: facebookPageAccessToken,
			message: message + "\n https://walla.co.il",
			url: imageUrl
		});

		expect(response.post_id).to.includes(facebookPageId);

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