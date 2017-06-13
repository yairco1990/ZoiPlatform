module.exports = {
    /**
     * get regular text message
     * @param text
     * @returns {{text: *}}
     */
    getRegularMessage: function (text) {
        return {"text": text};
    },

    /**
     * get image message
     * @param imageUrl
     * @returns {{attachment: {type: string, payload: {url: *}}}}
     */
    getImageMessage: function (imageUrl) {
        return {
	  "attachment": {
	      "type": "image",
	      "payload": {
		"url": imageUrl
	      }
	  }
        };
    },

    /**
     *
     * @param text
     * @param buttons
     */
    getButtonMessage: function (text, buttons) {

        if (!buttons) {
	  throw new Error("No buttons");
        }

        return {
	  "attachment": {
	      "type": "template",
	      "payload": {
		"template_type": "button",
		"text": text,
		"buttons": buttons
	      }
	  }
        };
    },

    getGenericButton: function (type, title, payload, url, webviewHeightRatio) {

        let response = {
	  "type": type,
	  "title": title
        };

        if (payload) {
	  response["payload"] = JSON.stringify(payload);
        }

        if (url) {
	  response["url"] = url;
        }

        if (webviewHeightRatio) {
	  response["webview_height_ratio"] = webviewHeightRatio;
        }


        return response;
    },

    getGenericElement: function (title, imageUrl, subtitle, buttons) {
        let response = {
	  "title": title,
	  "image_url": imageUrl,
	  "subtitle": subtitle,
	  // "default_action": {
	  //     "type": "web_url",
	  //     "url": "https://peterssendreceiveapp.ngrok.io/view?item=103",
	  //     "messenger_extensions": true,
	  //     "webview_height_ratio": "tall",
	  //     "fallback_url": "https://peterssendreceiveapp.ngrok.io/"
	  // },
	  "buttons": buttons
        };

        return response;
    },

    getGenericTemplate: function (title, imageUrl, elements) {

        if (!elements) {
	  throw new Error("No elements");
        }

        let response = {
	  "attachment": {
	      "type": "template",
	      "payload": {
		"template_type": "generic",
		"elements": [
		    {
		        "title": "Welcome to Peter\'s Hats",
		        "image_url": "https://petersfancybrownhats.com/company_image.png",
		        "subtitle": "We\'ve got the right hat for everyone.",
		        "default_action": {
			  "type": "web_url",
			  "url": "https://peterssendreceiveapp.ngrok.io/view?item=103",
			  "messenger_extensions": true,
			  "webview_height_ratio": "tall",
			  "fallback_url": "https://peterssendreceiveapp.ngrok.io/"
		        },
		        "buttons": [
			  {
			      "type": "web_url",
			      "url": "https://petersfancybrownhats.com",
			      "title": "View Website"
			  }, {
			      "type": "postback",
			      "title": "Start Chatting",
			      "payload": "DEVELOPER_DEFINED_PAYLOAD"
			  }
		        ]
		    }
		]
	      }
	  }
        };

        return response;
    }
};