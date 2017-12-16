const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const timestamps = require('mongoose-timestamp');

const blackListSchema = new Schema({
	_id: String,
	blockDate: Number,
	blockDateString: String
});

blackListSchema.plugin(timestamps);

module.exports = mongoose.model('BlackList', blackListSchema);