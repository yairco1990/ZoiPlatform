function buildReply(payload) {
    console.log(payload);

    // build message object
    var msg = {};

    // message text (user entered or quick reply)
    msg.text = !!payload.message.text ? payload.message.text : '';
    // default message type - text
    msg.type = "text";

    if (!!payload.message.quick_reply) {
        // for quick reply messages - get payload
        msg.type = "quick_reply";
        msg.payload = payload.message.quick_reply.payload;
    }

    // get message attachments
    if (!!payload.message.attachments) {
        msg.attachments = [];
        payload.message.attachments.forEach((att) => {
            msg.attachments.push({
                type: att.type,
                url: att.url || '',
                title: att.title || '',
                payload: att.payload || null
            });

            // if attachment type is "loadtion" so messsage contains location
            if (att.type == "location") {
                msg.type = "location";
            }
        });
    }

    console.log(msg);

    // build response object
    var result = {};

    if (msg.type == "quick_reply") {
        if (msg.payload == "LILI") {
            result = {
                "text": "Good choice!",
            };
        } else if (msg.payload == "JUSTIN") {
            result = {
                "text": "You are gay!",
            };
        } else if (msg.payload == "COLOR_RED") {
            result = {
                text: "Red is nice color"
            };
        } else if (msg.payload == "COLOR_GREEN") {
            result = {
                text: "Green is nice color"
            };
        } else if (msg.payload == "START_CHAT"){
            result = {
                text: "I don't want to chat with you"
            };
        }
    } else if (msg.type == "location") {
        result = {
            "text": 'You are in ' + msg.attachments[0].payload.coordinates.lat + ' ' + msg.attachments[0].payload.coordinates.long + '.'
        };
    } else if (msg.type == "text") {
        if (msg.text.toLowerCase() == "qr_text") {
            // text quick replies

            result = {
                "text": "Pick a color:",
                "quick_replies": [
                    {
                        "content_type": "text",
                        "title": "Red",
                        "payload": "COLOR_RED"
                    },
                    {
                        "content_type": "text",
                        "title": "Green",
                        "payload": "COLOR_GREEN"
                    }
                ]
            };
        } else if (msg.text.toLowerCase() == "qr_pics") {
            // text with small picture quick reply

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
            // ask for location

            result = {
                "text": "Please share your location:",
                "quick_replies": [
                    {
                        "content_type": "location",
                    }
                ]
            };
        } else if (msg.text.toLowerCase() == "qr_buttons") {
            // buttons template

            result = {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "button",
                        "text": "What do you want to do next?",
                        "buttons": [
                            {
                                "type": "web_url",
                                "url": "https://www.google.com",
                                "title": "Search Google"
                            },
                            {
                                "type": "postback",
                                "title": "Start Chatting",
                                "payload": "START_CHAT"
                            }
                        ]
                    }
                }
            };
        } else {
            // no special command - echo back original message

            result = {
                "text": msg.text,
            };
        }
    }

    // return response
    return result;
}

module.exports = {buildReply,};