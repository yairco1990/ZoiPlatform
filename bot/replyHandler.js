function buildReply(payload) {
	console.log(payload);
	
	var msg = {};
	
    msg.text = !!payload.message.text ? payload.message.text : '';
	msg.type = "text";
	
	if (!!payload.message.quick_reply){
		msg.type = "quick_reply";
		msg.payload = payload.message.quick_reply.payload;
	}
	
	if (!!payload.message. attachments){
		msg. attachments = [];
		payload.message. attachments.forEach((att)=>{
			msg. attachments.push({
				type: att.type,
				url: att.url || '',
				title: att.title || '',
				payload: att.payload || null
			});
			
			if (att.type == "location"){
				msg.type = "location";
			}
		});
	}
	
	console.log(msg);

    var result = {};
    var _continue = true;

	
    if (msg.type == "quick_reply"){
		if (msg.payload == "LILI"){
			result = {
				"text": "Good choice!",
			};
			_continue = false;
		} else if (msg.payload == "JUSTIN"){
			result = {
				"text": "You are gay!",
			};
			_continue = false;
		}
	} else if (msg.type == "location"){
		result = {
			"text": 'You are in ' + msg.attachments[0].payload.coordinates.lat + ' ' + msg.attachments[0].payload.coordinates.long + '.'
		};
		_continue = false;
	}

	if (_continue){
		if (msg.text.toLowerCase() == "qr_text") {
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
		} else if (msg.text.toLowerCase() == "qr_pics") {
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
		} else if (msg.text.toLowerCase() == "qr_location") {
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
				"text": msg.text,
			};
		}
	}
    return result;
}

module.exports = {buildReply,};