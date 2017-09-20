'use strict'
const url = require('url');
const qs = require('querystring');
const EventEmitter = require('events').EventEmitter;
const request = require('request-promise');
const crypto = require('crypto');
const MyLog = require('../interfaces/MyLog');

class Bot extends EventEmitter {
	/**
	 * constructor
	 * @param opts
	 */
	constructor(opts) {
		//super for event emitter
		super();

		opts = opts || {};
		if (!opts.token) {
			throw new Error('Missing page token. See FB documentation for details: https://developers.facebook.com/docs/messenger-platform/quickstart')
		}

		//set token, app secret, verify token and debug mode.
		this.token = opts.token;
		this.app_secret = opts.app_secret || false;
		this.verify_token = opts.verify || false;
		this.debug = opts.debug || false;
	}

	/**
	 * get facebook profile by id
	 * @param id
	 * @param cb
	 * @returns {*}
	 */
	getProfile(id, cb) {
		return request({
			method: 'GET',
			uri: `https://graph.facebook.com/v2.6/${id}`,
			qs: this._getQs({fields: 'first_name,last_name,profile_pic,locale,timezone,gender'}),
			json: true
		}).then(body => {
			if (body.error) return Promise.reject(body.error);
			if (!cb) return body;
			cb(null, body)
		}).catch(err => {
			if (!cb) return Promise.reject(err);
			cb(err)
		})
	}

	/**
	 * send message to the user
	 * the message wrapped with recipient object and message object
	 * @param recipient - the id of the recipient
	 * @param payload - come inside the message key
	 * @param cb - callback after finish to send
	 * @returns {*}
	 */
	sendMessage(recipient, payload, cb) {
		return request({
			method: 'POST',
			uri: 'https://graph.facebook.com/v2.6/me/messages',
			qs: this._getQs(),
			json: {
				recipient: {id: recipient},
				message: payload
			}
		})
			.then(body => {
				if (body.error) return Promise.reject(body.error);
				if (!cb) return body;
				cb(null, body)
			})
			.catch(err => {
				if (!cb) return Promise.reject(err);
				cb(err)
			})
	}

	/**
	 * send sender action
	 * for example, send the user that the bot is typing
	 * @param recipient - recipient id
	 * @param senderAction - which action
	 * @param cb - callback after finish to send the action
	 * @returns {*}
	 */
	sendSenderAction(recipient, senderAction, cb) {
		return request({
			method: 'POST',
			uri: 'https://graph.facebook.com/v2.6/me/messages',
			qs: this._getQs(),
			json: {
				recipient: {
					id: recipient
				},
				sender_action: senderAction
			}
		})
			.then(body => {
				if (body.error) return Promise.reject(body.error);
				if (!cb) return body;
				cb(null, body)
			})
			.catch(err => {
				if (!cb) return Promise.reject(err);
				cb(err)
			})
	}

	/**
	 * set thread settings
	 * for example, add button to the menu.
	 * @param threadState
	 * @param callToActions - for example, array of button we want to add to the menu options.
	 * @param cb
	 * @returns {*}
	 */
	setThreadSettings(threadState, callToActions, cb) {
		return request({
			method: 'POST',
			uri: 'https://graph.facebook.com/v2.6/me/thread_settings',
			qs: this._getQs(),
			json: {
				setting_type: 'call_to_actions',
				thread_state: threadState,
				call_to_actions: callToActions
			}
		})
			.then(body => {
				if (body.error) return Promise.reject(body.error);
				if (!cb) return body;
				cb(null, body)
			})
			.catch(err => {
				if (!cb) return Promise.reject(err);
				cb(err)
			})
	}

	/**
	 * remove thread settings
	 * @param threadState
	 * @param cb
	 * @returns {*}
	 */
	removeThreadSettings(threadState, cb) {
		return request({
			method: 'DELETE',
			uri: 'https://graph.facebook.com/v2.6/me/thread_settings',
			qs: this._getQs(),
			json: {
				setting_type: 'call_to_actions',
				thread_state: threadState
			}
		})
			.then(body => {
				if (body.error) return Promise.reject(body.error);
				if (!cb) return body;
				cb(null, body)
			})
			.catch(err => {
				if (!cb) return Promise.reject(err);
				cb(err)
			})
	}

	setGetStartedButton(payload, cb) {
		return this.setThreadSettings('new_thread', payload, cb)
	}

	setPersistentMenu(payload, cb) {
		return this.setThreadSettings('existing_thread', payload, cb)
	}

	removeGetStartedButton(cb) {
		return this.removeThreadSettings('new_thread', cb)
	}

	removePersistentMenu(cb) {
		return this.removeThreadSettings('existing_thread', cb)
	}

	_getQs(qs) {
		if (typeof qs === 'undefined') {
			qs = {}
		}
		qs['access_token'] = this.token;

		if (this.debug) {
			qs['debug'] = this.debug
		}

		return qs
	}

	/**
	 * handle message - launched after we finish to get the user message
	 * in general, check the event, and call the listeners of it.
	 * @param json
	 * @private
	 */
	_handleMessage(json) {
		let entries = json.entry;

		entries.forEach((entry) => {
			let events = entry.messaging;

			events.forEach((event) => {
				// handle inbound messages and echos
				if (event.message) {
					if (event.message.is_echo) {
						this._handleEvent('echo', event)
					} else {
						this._handleEvent('message', event)
					}
				}

				// handle postbacks
				if (event.postback) {
					this._handleEvent('postback', event)
				}

				// handle message delivered
				if (event.delivery) {
					this._handleEvent('delivery', event)
				}

				// handle message read
				if (event.read) {
					this._handleEvent('read', event)
				}

				// handle authentication
				if (event.optin) {
					this._handleEvent('authentication', event)
				}

				// handle referrals (e.g. m.me links)
				if (event.referral) {
					this._handleEvent('referral', event)
				}

				// handle account_linking
				if (event.account_linking && event.account_linking.status) {
					if (event.account_linking.status === 'linked') {
						this._handleEvent('accountLinked', event)
					} else if (event.account_linking.status === 'unlinked') {
						this._handleEvent('accountUnlinked', event)
					}
				}
			})
		})
	}

	_getActionsObject(event) {
		return {
			setTyping: (typingState, cb) => {
				let senderTypingAction = typingState ? 'typing_on' : 'typing_off';
				this.sendSenderAction(event.sender.id, senderTypingAction, cb)
			},
			markRead: this.sendSenderAction.bind(this, event.sender.id, 'mark_seen')
		}
	}

	_verify(req, res) {
		let query = qs.parse(url.parse(req.url).query);

		if (query['hub.verify_token'] === this.verify_token) {
			return res.end(query['hub.challenge'])
		}

		return res.end('Error, wrong validation token')
	}

	_handleEvent(type, event) {
		this.emit(type, event, this.sendMessage.bind(this, event.sender.id), this._getActionsObject(event))
	}


	/**
	 * get bot reply function
	 * @param user - the user that is going to get Zoi message
	 * @returns {Function}
	 */
	getBotReplyFunction(user) {
		const bot = this;

		return function (rep, isBotTyping, delay) {
			return new Promise(function (resolve, reject) {
				delay = delay || 0;
				setTimeout(() => {
					//send reply
					bot.sendMessage(user._id, rep, (err) => {
						if (err) {
							reject(err);
							return;
						}
						if (isBotTyping) {
							bot.sendSenderAction(user._id, "typing_on", () => {
								resolve();
							});
						} else {
							resolve();
						}
						if (user.fullname) {
							MyLog.info(`Message returned to ${user.fullname} [id: ${user._id}] -> ${rep.text ? rep.text : "Attachment"}`);
						} else {
							MyLog.info(`Message returned to [id: ${user._id}] -> ${rep.text ? rep.text : "Attachment"}`);
						}
					});
				}, delay);
			});
		};
	}

	/**
	 * get bot writing function
	 * @param user
	 * @returns {Function}
	 */
	getBotWritingFunction(user) {
		const bot = this;
		return function () {
			return new Promise(function (resolve, reject) {
				bot.sendSenderAction(user._id, "typing_on", () => {
					resolve();
				});
			});
		};
	}
}

module.exports = Bot;
