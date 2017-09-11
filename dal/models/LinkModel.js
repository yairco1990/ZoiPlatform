const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const linkSchema = new Schema({
	_id: String,
	url: String,
	numOfOpenings: { type: Number, default: 0 }
}, {minimize: false});

module.exports = mongoose.model('Link', linkSchema);