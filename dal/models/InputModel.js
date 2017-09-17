const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const inputsSchema = new Schema({
	_id: {
		type: Schema.ObjectId, default: function () {
			return new mongoose.Types.ObjectId()
		}
	},
	userId: String,
	input: String,
	intent: String,
	score: Number
}, {minimize: false});

module.exports = mongoose.model('Inputs', inputsSchema);