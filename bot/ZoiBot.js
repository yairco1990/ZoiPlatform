/**
 * exports the bot for everyone and make it singleton
 * @type {Bot}
 */
const Bot = require('./bot_framework');
const ZoiConfig = require('../config');
const zoiBot = new Bot(ZoiConfig.BOT_DETAILS);

module.exports = zoiBot;