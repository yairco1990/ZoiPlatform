function buildReply(message) {
    var result = {};

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
            "text": "Pick a color:",
            "quick_replies": [
                {
                    "content_type": "text",
                    "title": "Red",
                    "payload": "DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED",
                    "image_url": "http://petersfantastichats.com/img/red.png"
                },
                {
                    "content_type": "text",
                    "title": "Green",
                    "payload": "DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_GREEN",
                    "image_url": "http://petersfantastichats.com/img/green.png"
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
        }
    }

    return result;
}

module.exports = {buildReply,};