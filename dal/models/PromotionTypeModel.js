const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const promotionTypesSchema = new Schema({
	_id: Number,
	name: String
});

module.exports = mongoose.model('PromotionTypes', promotionTypesSchema);