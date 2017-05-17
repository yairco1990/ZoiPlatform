function buildReply(payload) {
    var text = !!payload.message.text ? payload.message.text : JSON.stringify(payload.message);
    var msg_payload = !!payload.message.quick_reply && !!payload.message.quick_reply.payload ? payload.message.quick_reply.payload : null;

    var result = {};
    var _continue = true;

    if (msg_payload){
		if (payload == "LILI"){
			result = {
				"text": "Good choice!",
			};
			_continue = false;
		} else if (payload == "JUSTIN"){
			result = {
				"text": "You are gay!",
			};
			_continue = false;
		}
	}

	if (_continue){
		if (text.toLowerCase() == "qr_text") {
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
		} else if (text.toLowerCase() == "qr_pics") {
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
		} else if (text.toLowerCase() == "qr_location") {
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
				"text": text,
			};
		}
	}
    return result;
}

module.exports = {buildReply,};