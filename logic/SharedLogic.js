'use strict';

let requestify = require('requestify');

module.exports = {

	/**
	 * post on user facebook page
	 * @returns {*}
	 */
	postOnFacebook: function (message) {
		return requestify.request('https://graph.facebook.com/v2.9/feed', {
			method: 'POST',
			dataType: "form-url-encoded",
			params: {
				message: message,
				access_token: "EAACEdEose0cBADqS9FnDNPDEvTcm9ZA8dMdoq8XxjmwIqz4ti4lwggOGmORvUQ4tM2DYtG8PZCSRtKWX8TyNhX2frBcDdbs4d8zFn8zoZBr3bayaa65OEZBqZB2YkanZBtfpz6SZBeGmJlOdayhQUclz3a41VxR1S8pLFWjfWRJJOEwRZB6tJZBg90jJfrzywVeAZD"
			}
		}).then(body => {
			if (body.error) return Promise.reject(body.error);
		}).catch(err => {
			if (!cb) return Promise.reject(err);
		});
	}
};