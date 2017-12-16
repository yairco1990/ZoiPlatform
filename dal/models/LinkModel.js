const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const timestamps = require('mongoose-timestamp');

const linkSchema = new Schema({
	_id: String,
	url: String,
	numOfOpenings: { type: Number, default: 0 }
}, {minimize: false});

linkSchema.plugin(timestamps);

module.exports = mongoose.model('Link', linkSchema);