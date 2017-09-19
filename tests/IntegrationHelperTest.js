const TestHelper = require('./TestHelper');
const sinon = require('sinon');
const chai = require('chai');
const expect = require('chai').expect;
const deepcopy = require('deepcopy');
const assert = require('assert');
const MyLog = require('../interfaces/MyLog');
const IntegrationHelper = require('../logic/Helpers/IntegrationHelper');

let user;

describe('IntegrationHelper Class', function () {

	beforeEach(() => {
		user = {};
	});

	//get missing integrations function
	describe.only('getMissingIntegrations function', function () {

		it('check success', function () {
			user.isAcuityIntegrated = true;
			user.isFacebookIntegrated = false;
			user.isGmailIntegrated = false;

			let userMissingIntegrations = IntegrationHelper.getMissingIntegrations(user, "test");

			expect(userMissingIntegrations[0]).to.equals("Gmail");
			expect(userMissingIntegrations[1]).to.equals(undefined);

			user.isAcuityIntegrated = false;
			user.isGmailIntegrated = true;
			user.isFacebookIntegrated = false;

			userMissingIntegrations = IntegrationHelper.getMissingIntegrations(user, "test");

			expect(userMissingIntegrations[0]).to.equals("Acuity Scheduling");
			expect(userMissingIntegrations[1]).to.equals("Facebook");

			user.isAcuityIntegrated = true;
			user.isGmailIntegrated = true;
			user.isFacebookIntegrated = false;

			userMissingIntegrations = IntegrationHelper.getMissingIntegrations(user, "test");

			expect(userMissingIntegrations.length).to.equals(0);

			user.isFacebookIntegrated = false;
			user.isGmailIntegrated = true;
			user.isAcuityIntegrated = false;

			userMissingIntegrations = IntegrationHelper.getMissingIntegrations(user, "test");

			expect(userMissingIntegrations[0]).to.equals("Acuity Scheduling");
			expect(userMissingIntegrations[1]).to.equals("Facebook");

			user.isFacebookIntegrated = true;
			user.isGmailIntegrated = false;
			user.isAcuityIntegrated = true;

			userMissingIntegrations = IntegrationHelper.getMissingIntegrations(user, "test");

			expect(userMissingIntegrations[0]).to.equals("Gmail");
		});

	});

	describe('getMissingIntegrationsText function', function () {
		it('check success', function () {
			user.isFacebookIntegrated = true;
			user.isGmailIntegrated = false;
			user.isAcuityIntegrated = true;

			let textResult = IntegrationHelper.getMissingIntegrationsText(user, "test");

			expect(textResult).to.equals("Gmail.");

			user.isFacebookIntegrated = true;
			user.isGmailIntegrated = true;
			user.isAcuityIntegrated = false;

			textResult = IntegrationHelper.getMissingIntegrationsText(user, "test");

			expect(textResult).to.equals("");

			user.isFacebookIntegrated = false;
			user.isGmailIntegrated = true;
			user.isAcuityIntegrated = false;

			textResult = IntegrationHelper.getMissingIntegrationsText(user, "test");

			expect(textResult).to.equals("Acuity Scheduling, Facebook.");
		});
	});
});
