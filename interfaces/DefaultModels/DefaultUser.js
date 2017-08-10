const moment = require('moment');
const deepCopy = require('deepcopy');

let DefaultUser = {
	integrations: {},
	metadata: {},
	profile: {},
	startedAt: moment().format('lll'),
	nextMorningBriefDate: moment().hours(9).minutes(0).add(1, 'days').valueOf(),
	nextOldCustomersDate: moment().hours(12).minutes(0).add(1, 'days').valueOf(),
	morningBriefTime: "09:00",
	defaultCalendar: {
		"id": -1,
		"name": "All calendars"
	},
	promptNewCustomers: true,
	customerSendLimit: {
		"text": "1 promo per week",
		"value": 7
	},
	oldCustomersRange: {
		"text": "1 month",
		"value": 30
	},
	lastMessageTime: moment().valueOf(),
};

module.exports = deepCopy(DefaultUser);