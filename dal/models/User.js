const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
	_id: String,
	fullname: String,
	email: String,
	conversationData: Object,
	session: Object,
	integrations: Object,
	metadata: Object,
	wishList: [String],
	keyWords: [String],
	categories: [String],
	profile: Object,
	startedAt: String,
	nextMorningBriefDate: Number,
	nextOldCustomersDate: Number,
	morningBriefTime: String,
	defaultCalendar: Object,
	promptNewCustomers: Boolean,
	customerSendLimit: Object,
	oldCustomersRange: Object,
	lastMessageTime: Number,
	timezone: String,
	isOnBoarded: Boolean
}, {minimize: false});

module.exports = mongoose.model('User', userSchema);
;