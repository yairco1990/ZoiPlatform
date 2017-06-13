let BookerplusLogic = require('./BookerplusLogic');
let Util = require('util');
let facebookResponse = require('../interfaces/FacebookResponse');


function PostbackLogic() {
    this.bookerplusLogic = new BookerplusLogic("eyJjdHkiOiJ0ZXh0XC9wbGFpbiIsImFsZyI6IkhTMjU2In0.eyJzZXNzaW9uVG9rZW4iOiI1OGZjMGNkOS01MjJlLTQzZmMtODI4Yi01YmFhZTEzZmY2ZGEiLCJpZCI6MTgzNCwidHlwZSI6MX0.cxiL0yX4knjiRJlUGutB0CIsQaRsddyLreHURZVFH4o");
}

/**
 * process action that return from user pressed button
 * @param payload
 * @param callback
 */
PostbackLogic.prototype.processAction = function (payload, callback) {
    let self = this;

    if (payload.action == "BRING_NEXT_QUEUES") {
        self.bookerplusLogic.getQueues(null, payload.params, callback);
    }
};

PostbackLogic.prototype.processMockAction = function (payload, callback) {
    let self = this;

    if (payload.type.includes("REVENUE_REPORTER")) {

        callback(200, facebookResponse.getRegularMessage("Hi boss"));

    } else if (payload.type.includes("Yes, I want to send promotions")) {

        let delayTime = 3000;

        callback(200, facebookResponse.getRegularMessage("I'm on it ;)"));

        setTimeout(function () {
	  callback(200, facebookResponse.getRegularMessage("Done! I sent an email to your most relevant customers! 👏"));

	  setTimeout(function () {
	      callback(200, facebookResponse.getRegularMessage("I see some of your customers respond to your offer"));
	  }, delayTime);
        }, delayTime);

    } else if (payload.type.includes("No, I don't want to send a promotion")) {

        callback(200, facebookResponse.getRegularMessage("OK boss"));

    } else if (payload.type.includes("webview")) {

        callback(200, facebookResponse.getButtonMessage("Do you want to check webview?", [
	  facebookResponse.getGenericButton("web_url", "Open webview compact", null, "http://dice.beezee.be/test.html", "compact"),
	  facebookResponse.getGenericButton("web_url", "Open webview tall", null, "http://dice.beezee.be/test.html", "tall"),
	  facebookResponse.getGenericButton("web_url", "Open webview full", null, "http://dice.beezee.be/test.html", "full"),
        ]));

    } else {

        callback(200, facebookResponse.getRegularMessage("I have nothing to say"));

    }
};

module.exports = PostbackLogic;