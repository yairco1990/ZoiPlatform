const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const blackListSchema = new Schema({
	_id: String,
	blockDate: Number,
	blockDateString: String
});

module.exports = mongoose.model('BlackList', blackListSchema);