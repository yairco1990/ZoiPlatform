/**
 * Created by Yair on 2/20/2017.
 */
const MyLog = require('./MyLog');
const fs = require('fs');
const webshot = require('webshot');
const moment = require('moment');
const SmallTalk = require('./assets/SmallTalk');
const _ = require('underscore');

let Utils = {

	serverResponse: {
		SUCCESS: "success",
		ERROR: "error"
	},

	/**
	 * log functions
	 */
	log: {
		error: function (text) {
			console.error(moment().format("D MMM HH:mm:ss - ") + text);
		},
		info: function (text) {
			console.info(moment().format("D MMM HH:mm:ss - ") + text);
		},
		debug: function (text) {
			console.debug(moment().format("D MMM HH:mm:ss - ") + text);
		}
	},

	/**
	 * getJSON:  REST get request returning JSON object(s)
	 * @param options: http options object
	 * @param callback: callback to pass the results JSON object(s) back
	 */
	restRequest: function (options, asString, onResult) {

		let protocol = options.port == 443 ? https : http;
		let req = protocol.request(options, function (res) {
			let output = '';

			res.setEncoding('utf8');

			res.on('data', function (chunk) {
				output += chunk;
			});

			res.on('end', function () {
				let obj = output;
				if (!asString) {
					obj = JSON.parse(output);
				}
				onResult(res.statusCode, obj);
			});
		});

		req.on('error', function (err) {
			console.error("failed to make restRequest due to");
			console.error(err);
		});

		req.end();
	},

	/**
	 * build path with params
	 * @param path
	 * @param params
	 */
	buildPath: function (path, params) {

		path += "?";

		for (let property in params) {

			if (params.hasOwnProperty(property)) {

				path += property + "=" + params[property];

				path += "&";
			}
		}

		return path;
	},

	logicType: {
		MOCK: "Mock",
		REAL_WORLD: "Real world"
	},

	/**
	 * set capital letter for first char in each word in the string
	 * @param str
	 * @returns {string}
	 */
	setCapitalLetterForEveryWord: function (str) {

		let result = "";

		str.split(' ').forEach(function (str) {
			result += str.charAt(0).toUpperCase() + str.slice(1) + " ";
		});

		return result.trim();
	},

	/**
	 * get html url and return new url to get screenshot of this html page
	 * @param imageUrl
	 * @returns {string}
	 */
	getImageByHtml: function (imageUrl) {
		return "https://zoiai.com:3000/getImage/" + imageUrl;
	},

	/**
	 * get screenshot of html page
	 * @param res
	 * @param imageUrl
	 */
	getScreenShot: function (res, imageUrl) {
		res.writeHead(200, {'Content-Type': 'image/jpeg'});

		let options = {
			screenSize: {
				width: 'all',
				height: 'all'
			},
			shotSize: {
				width: 'all',
				height: 'all'
			},
			defaultWhiteBackground: true,
			userAgent: 'Mozilla/5.0 (iPhone; U; CPU iPhone OS 3_2 like Mac OS X; en-us)' + ' AppleWebKit/531.21.20 (KHTML, like Gecko) Mobile/7B298g'
		};

		webshot(imageUrl, options, function (err, renderStream) {
			renderStream.pipe(res);
		});
	},

	getSimilarityFromArray: function (input, array, prop) {

		let self = this;

		let maxSimilarity = 0;

		let result = null;

		array.forEach(function (item) {
			let currentSimilarity = self.similarity(input, item[prop]);
			if (currentSimilarity > maxSimilarity) {
				result = item;
				maxSimilarity = currentSimilarity;
			}
		});

		return result;
	},

	getSimilarityFromMocks: function (input, mocks) {

		let self = this;

		let maxSimilarity = 0;

		let result = null;

		for (let key in mocks) {
			if (mocks.hasOwnProperty(key)) {
				let currentSimilarity = self.similarity(input, mocks[key]);
				if (currentSimilarity > maxSimilarity) {
					result = mocks[key];
					maxSimilarity = currentSimilarity;
				}
			}
		}

		return result;
	},

	similarity: function (s1, s2) {

		let self = this;

		let longer = s1;
		let shorter = s2;
		if (s1.length < s2.length) {
			longer = s2;
			shorter = s1;
		}
		let longerLength = longer.length;
		if (longerLength == 0) {
			return 1.0;
		}
		return (longerLength - self.editDistance(longer, shorter)) / parseFloat(longerLength);
	},

	editDistance: function (s1, s2) {
		s1 = s1.toLowerCase();
		s2 = s2.toLowerCase();

		let costs = [];
		for (let i = 0; i <= s1.length; i++) {
			let lastValue = i;
			for (let j = 0; j <= s2.length; j++) {
				if (i == 0)
					costs[j] = j;
				else {
					if (j > 0) {
						let newValue = costs[j - 1];
						if (s1.charAt(i - 1) != s2.charAt(j - 1))
							newValue = Math.min(Math.min(newValue, lastValue),
								costs[j]) + 1;
						costs[j - 1] = lastValue;
						lastValue = newValue;
					}
				}
			}
			if (i > 0)
				costs[s2.length] = lastValue;
		}
		return costs[s2.length];
	},

	validateEmail: function (email) {
		let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(email);
	},

	// addParamsToUrlArray: function (url, params) {
	// 	let newUrl = url + '?';
	// 	params.forEach(function (p, index) {
	// 		if (index > 0) {
	// 			newUrl += "&";
	// 		}
	// 		newUrl += p.key + "=" + p.value;
	// 	});
	//
	// 	return newUrl;
	// },

	addParamsToUrl: function (url, params) {
		let newUrl = url + '?';
		let index = 0;
		for (let key in params) {
			if (params.hasOwnProperty(key)) {
				if (index > 0) {
					newUrl += "&";
				}
				newUrl += key + "=" + params[key];
				index++;
			}
		}

		return newUrl;
	},

	/**
	 * check if in the arr there is key with the selected value
	 * @param arr
	 * @param key
	 * @param value
	 * @returns {boolean}
	 */
	isExist: function (arr, key, value) {
		let isExist = false;
		if (key) {
			arr.forEach(function (item) {
				if (item[key] == value) {
					isExist = true;
				}
			});
		} else {
			arr.forEach(function (item) {
				if (item == value) {
					isExist = true;
				}
			});
		}
		return isExist;
	},

	removeDuplicates: function (arr, key) {
		let newArr = [];
		arr.forEach(function (item) {
			if (!this.isExist(newArr, key, item[key])) {
				newArr.push(item);
			}
		});
		return newArr;
	},

	convertToAcuityDate: function (time) {
		if (time) {
			return moment(time).format('YYYY-MM-DDTHH:mm:ss');
		}
		return moment().format('YYYY-MM-DDTHH:mm:ss');
	},

	getErrorMsg: function (onFinally) {
		return function (err) {
			if (err) {
				MyLog.error("Error:");
				MyLog.error(err);
				onFinally && onFinally(err);
			}
		}
	},

	replaceAll: function (find, replace, str) {
		find = find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
		return str.replace(new RegExp(find, 'g'), replace);
	},

	resolveMessage: function (reply, message, isBotTyping, delay) {
		return function (cb) {
			reply(message, isBotTyping, delay).then(() => {
				cb && cb();
			}).catch((err) => {
				console.error(err);
			})
		};
	},

	getResponseByIntent: function (intent) {
		try {
			let intentObj = _.findWhere(SmallTalk, {intent: intent});
			if (intentObj) {
				let responses = intentObj.responses;
				return responses[Math.floor(Math.random() * responses.length)];
			}
			return null;
		} catch (err) {
			console.error(err);
			return null;
		}
	},

	removeClientsExistOnList: function (list, clients, emailProperty) {
		//get clear list of emails only
		list = _.map(list, function (obj) {
			return obj[emailProperty];
		});

		//remove clients by list emails
		return clients.filter(function (client) {
			return list.indexOf(client.email) === -1;
		});
	},

	getRandomValueFromArray: function (arr) {
		return arr[Math.floor(Math.random() * arr.length)];
	},

	/**
	 * check if string is json object
	 * @param str
	 * @returns {boolean}
	 * @constructor
	 */
	isJson: function (str) {
		try {
			JSON.parse(str);
		} catch (e) {
			return false;
		}
		return true;
	},

	/**
	 * get random n objects from array
	 * @param arr
	 * @param n
	 * @returns {Array}
	 */
	getRandomFromArray: function (arr, n) {
		var result = new Array(n),
			len = arr.length,
			taken = new Array(len);
		if (n > len)
			throw new RangeError("getRandom: more elements taken than available");
		while (n--) {
			var x = Math.floor(Math.random() * len);
			result[n] = arr[x in taken ? taken[x] : x];
			taken[x] = --len;
		}
		return result;
	}
};

module.exports = Utils;
