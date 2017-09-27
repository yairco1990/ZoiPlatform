/**
 * Created by Yair on 2/20/2017.
 */
const MyLog = require('./MyLog');
const fs = require('fs');
const webshot = require('webshot');
const moment = require('moment-timezone');
const SmallTalk = require('./assets/SmallTalk');
const _ = require('underscore');
const request = require('request-promise');
const parseString = require('xml2js').parseString;

let Utils = {

	SUCCESS: "success",
	ERROR: "error",

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

		let maxSimilarity = -1;

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

	printArrWithCommas: function (array) {
		let result = "";
		array.forEach((item, index) => {
			if (index < array.length - 1) {
				result += item + ", ";
			} else {
				result += item + ".";
			}
		});
		return result.trim();
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
	 * @param arr - the arr we want to search on
	 * @param key - run on the array objects, and look for values with this key
	 * @param value - the value we want to find for the given key
	 * @returns {boolean}
	 */
	isExist: function (arr, key, value) {
		let isExist = false;
		if (key) {
			arr.forEach(function (item) {
				if (item[key] === value) {
					isExist = true;
				}
			});
		} else {
			arr.forEach(function (item) {
				if (item === value) {
					isExist = true;
				}
			});
		}
		return isExist;
	},

	removeDuplicates: function (arr, key) {
		const self = this;
		const newArr = [];
		arr.forEach(function (item) {
			if (!self.isExist(newArr, key, item[key])) {
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

	generateUUID: function () {
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000)
				.toString(16)
				.substring(1);
		}

		return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
			s4() + '-' + s4() + s4() + s4();
	},

	isUUID: function (id) {
		return id.includes('-');
	},

	isPageUserId: function () {
		return !id.includes('-');
	},

	/**
	 * generate random string
	 * @param length - length of the generated string
	 * @param withSpaces - boolean
	 * @returns {string}
	 */
	generateRandomString: function (length, withSpaces = false) {

		let str = "123456789qwertyuiopasdfghjklzxcvbnm";

		if (withSpaces) {
			str += "         ";
		}

		let result = "";

		for (let i = 0; i < length; i++) {
			result += str.charAt(Math.floor(Math.random() * str.length));
		}

		return result;
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
		let result = new Array(n),
			len = arr.length,
			taken = new Array(len);
		if (n > len)
			return arr;
		while (n--) {
			let x = Math.floor(Math.random() * len);
			result[n] = arr[x in taken ? taken[x] : x];
			taken[x] = --len;
		}
		return result;
	},

	/**
	 * because a.b.c.d return error if b is not exist - I made this function
	 * when you call this function with this scenario you will get null
	 * @param obj(Object) - the object, in our case - a
	 * @param nestedKey(String) - the nested key, in our case = "b.c.d"
	 * @returns {*}
	 */
	nestedValue: function (obj, nestedKey) {
		try {
			const nestedKeySplit = nestedKey.split('.');
			let currentResult = obj;
			for (let key of nestedKeySplit) {
				if (key.includes('[') && key.includes(']')) {

					const keyWithoutIndex = key.substring(0, key.indexOf('['));

					currentResult = currentResult[keyWithoutIndex];

					key = key.substring(key.indexOf('[') + 1, key.indexOf(']'));
				}
				if (currentResult[key]) {
					currentResult = currentResult[key];
				} else {
					return null;
				}
			}
			return currentResult;
		} catch (err) {
			return null;
		}
	},

	makeRequest: function (method, url) {
		const self = this;

		const requestParams = {
			method: method,
			uri: url,
		};

		return new Promise((resolve, reject) => {
			request(requestParams).then(body => {
				if (body.error) return reject(body.error);
				if (self.isJson(body)) {
					return resolve(JSON.parse(body));
				}
				resolve(body);
			}).catch(err => {
				reject(err)
			})
		});
	},

	convertXmlToJson: function (xml) {
		return new Promise((resolve, reject) => {
			parseString(xml, function (err, result) {
				if (err) {
					return reject(err);
				}
				resolve(result);
			});
		});
	},


	clearHtmlSigns: function (str) {
		let newStr;
		newStr = this.replaceAll("&rsquo;", "'", str);
		newStr = this.replaceAll("&nbsp;", " ", newStr);
		return newStr;
	},

	getIpv4Address: function () {
		const os = require('os');
		const ifaces = os.networkInterfaces();

		let result = null;

		Object.keys(ifaces).forEach(function (ifname) {
			var alias = 0;

			ifaces[ifname].forEach(function (iface) {
				if ('IPv4' !== iface.family || iface.internal !== false) {
					// skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
					return;
				}
				result = iface.address;
				++alias;
			});
		});

		return result;
	}
};

module.exports = Utils;
