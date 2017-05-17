function buildReply(message){
    var result = {};

    if (message == "testme"){
        result = {
            "text":"Pick a color:",
            "quick_replies":[
                {
                    "content_type":"text",
                    "title":"Red",
                    "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED"
                },
                {
                    "content_type":"text",
                    "title":"Green",
                    "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_GREEN"
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