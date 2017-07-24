const fs = require('fs');
const ses = require('node-ses');
const ZoiConfig = require('../config');
const Util = require('util');

class EmailLib {
	/**
	 * get email html file
	 * @param path - to the email file
	 * @returns {Promise}
	 */
	static getEmailFile(path) {
		return new Promise(function (resolve, reject) {
			fs.readFile(path, 'utf8', function (err, emailHtml) {
				if (err) {
					reject(err);
				} else {
					resolve(emailHtml);
				}
			});
		});
	}

	/**
	 * send emails
	 * @param emailHtml - the file that you want to send
	 * @param emails - emails list to send
	 */
	static sendEmail(emailHtml, emails) {
		//AWS client
		let client = ses.createClient(ZoiConfig.AWS);

		if (!emailHtml) {
			emailHtml = "<div>Test Message</div>";
		}

		// emailHtml = emailHtml.replace('{{botPage}}', '');
		try {
			emails.forEach(function (email) {
				if (email.address) {
					// Give SES the details and let it construct the message for you.
					client.sendEmail({
						to: email.address,
						from: email.from,// 'Zoi.AI <noreply@fobi.io>',
						subject: email.subject, //'Your brand new bot',
						message: emailHtml,
						altText: email.alt
					}, function (err) {
						if (err) {
							Util.log("Error:");
							Util.log(err);
						}
					});
				}
			});
		} catch (err) {
			Util.log("Error:");
			Util.log(err);
		}
	}
}

module.exports = EmailLib;