function buildReply(message, payload) {
    var result = {};

	if (payload){
		if (payload == "LILI"){
			result = {
				"text": "Good choice!",
			};
		} else if (payload == "JUSTIN"){
			result = {
				"text": "You are gay!",
			};
		}
	} else {	
		if (message.toLowerCase() == "qr_text") {
			result = {
				"text": "Pick a color:",
				"quick_replies": [
					{
						"content_type": "text",
						"title": "Red",
						"payload": "DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED"
					},
					{
						"content_type": "text",
						"title": "Green",
						"payload": "DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_GREEN"
					}
				]
			};
		} else if (message.toLowerCase() == "qr_pics") {
			result = {
				"text": "Choose your favorite:",
				"quick_replies": [
					{
						"content_type": "text",
						"title": "Justin Bieber",
						"payload": "JUSTIN",
						"image_url": "http://cdn3.thr.com/sites/default/files/2013/11/9713_01_0270.jpg"
					},
					{
						"content_type": "text",
						"title": "Lili Simmons",
						"payload": "LILI",
						"image_url": "http://static.cinemagia.ro/img/db/actor/36/58/38/lili-simmons-959934l.jpg"
					}
				]
			};
		} else if (message.toLowerCase() == "qr_location") {
			result = {
				"text": "Please share your location:",
				"quick_replies": [
					{
						"content_type": "location",
					}
				]
			};
		} else {
			result = {
				"text": message,
			};
		}
	}
    return result;
}

module.exports = {buildReply,};