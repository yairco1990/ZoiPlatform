const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const timestamps = require('mongoose-timestamp');

const promotionSchema = new Schema({
	_id: Number,
	title: String,
	appointmentType: String,
	appointmentTypeId: Number,
	date: Date,
	text: String
});

promotionSchema.plugin(timestamps);

module.exports = mongoose.model('Promotion', promotionSchema);