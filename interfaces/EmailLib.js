const fs = require('fs');
const ses = require('node-ses');
const ZoiConfig = require('../config');
const MyLog = require('./MyLog');
const deepcopy = require('deepcopy');

//save zoi emails
const ZoiEmails = {};

class EmailLib {

	static loadEmails() {
		EmailLib.getEmailFile(__dirname + "/assets/promotionsMail.html").then(function (emailHtml) {
			ZoiEmails.promotionsMail = emailHtml;
		});
	}

	static getEmailByName(name) {
		return deepcopy(ZoiEmails[name]);
	}

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
			emailHtml = "<div>Hey, it's Zoi.</div>";
		}

		try {
			emails.forEach(function (email) {
				//@email.com domain is saved for Zoi testing
				if (email.address && !email.address.includes("@email.com")) {
					//if this is not production and it's not yair email - don't send it
					if (!ZoiConfig.isProduction && email.address !== "yairco1990@gmail.com") {
						return;
					}
					// Give SES the details and let it construct the message for you.
					client.sendEmail({
						to: email.address,
						from: email.from,// 'Zoi.AI <noreply@fobi.io>',
						subject: email.subject, //'Your brand new bot',
						message: emailHtml,
						altText: email.alt,
						replyTo: email.replyTo
					}, function (err) {
						if (err) {
							MyLog.error(err);
						}
					});
				}
			});
		} catch (err) {
			MyLog.error(err);
		}
	}
}

module.exports = EmailLib;