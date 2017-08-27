module.exports = {
	/**
	 * get regular text message
	 * @param text
	 * @returns {{text: *}}
	 */
	getTextMessage: function (text) {
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

		if (!payload && !url) {
			response.payload = title;
		}

		return response;
	},

	getGenericElement: function (title, imageUrl, subtitle, buttons) {
		let response = {
			"title": title,
			"subtitle": subtitle,
			"buttons": buttons
		};

		if (imageUrl) {
			response["image_url"] = imageUrl;
		}

		return response;
	},

	getGenericTemplate: function (elements) {

		if (!elements) {
			throw new Error("No elements");
		}

		let response = {
			"attachment": {
				"type": "template",
				"payload": {
					"template_type": "generic",
					"elements": elements
				}
			}
		};

		return response;
	},

	getQRElement: function (text, qrButtons) {
		return {
			"text": text,
			"quick_replies": qrButtons
		}
	},

	getQRButton: function (content_type, title, payload) {

		let response = {
			"content_type": content_type,
			"title": title,
			"payload": JSON.stringify(payload)
		};

		if (!response.payload) {
			response.payload = JSON.stringify({title: title});
		}

		return response;
	},

	getShareMessage: function (title, subtitle, imageUrl, buttons) {
		return {
			"attachment": {
				"type": "template",
				"payload": {
					"template_type": "generic",
					"elements": [
						{
							"title": title,
							"subtitle": subtitle,
							"image_url": imageUrl,
							"buttons": buttons
						}
					]
				}
			}
		};
	},

	getShareButton: function (title, description, imageUrl) {
		return {
			"attachment": {
				"type": "template",
				"payload": {
					"template_type": "generic",
					"elements": [
						{
							"title": title,
							"subtitle": description,
							"image_url": imageUrl,
							"buttons": [
								{
									"type": "element_share"
								}
							]
						}
					]
				}
			}

		}
	}
};