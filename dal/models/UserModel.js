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
	category: String,
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
	schedulingPageLink: String,
	isOnBoarded: Boolean
}, {minimize: false});

userSchema.virtual('isAcuityIntegrated').get(function () {
	return !!this.integrations.Acuity;
});
userSchema.virtual('isGmailIntegrated').get(function () {
	return !!this.integrations.Gmail;
});
userSchema.virtual('isFacebookIntegrated').get(function () {
	return !!this.integrations.Facebook;
});

module.exports = mongoose.model('User', userSchema);