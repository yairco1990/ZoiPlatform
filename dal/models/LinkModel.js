const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const linkSchema = new Schema({
	_id: String,
	url: String
}, {minimize: false});

module.exports = mongoose.model('Link', linkSchema);