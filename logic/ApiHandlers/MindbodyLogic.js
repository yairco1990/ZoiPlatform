const soap = require('soap');
const fs = require('fs');
const Util = require('util');
const MyUtils = require('../../interfaces/utils');

const mindbodyApiUrl = 'https://api.mindbodyonline.com/0_5';

/**
 * @param credentials
 * @constructor
 */
function MindbodyLogic(credentials) {
    this.requestBody = {
        Request: {
	  SourceCredentials: {
	      SourceName: credentials.sourceName || "MyPatShop",
	      Password: credentials.password || "/F91KtIIXKfVxDr7cqs7R2VsG6g=",
	      SiteIDs: credentials.siteIds || [{int: -99}]
	  },
	  UserCredentials: {
	      Username: credentials.username || "Siteowner",
	      Password: credentials.userPassword || "apitest1234",
	      SiteIDs: credentials.userSiteIds || [{int: -99}]
	  }
        }
    };

    this.wdsl = [
        {soap_version: "SOAP_1_1"},
        {trace: true}
    ];
}

/**
 * get client
 * @param entities - can be the name of the client
 * @returns {Promise}
 */
MindbodyLogic.prototype.getAppointments = function (entities) {

    Util.log("getAppointments function from mindbody");

    let self = this;

    return new Promise(function (resolve, reject) {

        let url = mindbodyApiUrl + '/AppointmentService.asmx?wsdl';

        soap.createClient(url, self.wdsl, function (err, client) {

	  if (err) {
	      reject(err);
	      return;
	  }

	  let authRequest = self.getAuthRequest();

	  authRequest.Request.StaffCredentials = authRequest.Request.UserCredentials;
	  authRequest.Request.StaffIDs = [{long: 0}];

	  client.GetStaffAppointments(authRequest, function (err, result) {

	      if (err || result.GetStaffAppointmentsResult.ErrorCode != 200) {
		reject(err);
	      } else {
		if (result.GetStaffAppointmentsResult.Appointments) {
		    resolve(result.GetStaffAppointmentsResult.Appointments.Appointment);
		} else {
		    //return empty appointments
		    resolve([]);
		}
	      }
	  });
        });
    });
};

MindbodyLogic.prototype.getNextFreeSlot = function (entities) {

    Util.log("getNextFreeSlot function from mindbody");

    let self = this;

    return new Promise(function (resolve, reject) {

        let url = mindbodyApiUrl + '/AppointmentService.asmx?wsdl';

        soap.createClient(url, self.wdsl, function (err, client) {

	  if (err) {
	      reject(err);
	      return;
	  }

	  let authRequest = self.getAuthRequest();

	  if (entities.sessionTypeId) {
	      authRequest.Request.SessionTypeIDs = [{int: entities.sessionTypeId}];
	  }

	  client.GetBookableItems(authRequest, function (err, result) {

	      if (err || result.GetBookableItemsResult.ErrorCode != 200) {
		reject(err);
	      } else {
		if (result.GetBookableItemsResult.Bookables.Bookabl) {
		    resolve(result.GetBookableItemsResult.Bookables.Bookabl);
		} else {
		    //return empty appointments
		    resolve([]);
		}
	      }
	  });
        });
    });
};

/**
 * get classes
 * @returns {Promise}
 */
MindbodyLogic.prototype.getClasses = function () {

    let self = this;

    Util.log("getClasses from mindbody function");

    return new Promise(function (resolve, reject) {

        let url = mindbodyApiUrl + '/ClassService.asmx?wsdl';

        soap.createClient(url, self.wdsl, function (err, client) {

	  if (err) {
	      reject(err);
	      return;
	  }

	  let authRequest = self.getAuthRequest();

	  client.GetClasses(self.requestBody, function (err, result) {

	      if (err) {
		reject(err);
	      } else {
		resolve(result.GetClassesResult);
	      }
	  });
        });
    });
};

/**
 * get sales
 * @returns {Promise}
 */
MindbodyLogic.prototype.getSales = function () {

    Util.log("getSales from mindbody function");

    let self = this;

    return new Promise(function (resolve, reject) {

        let url = mindbodyApiUrl + '/SaleService.asmx?wsdl';

        soap.createClient(url, self.wdsl, function (err, client) {

	  if (err) {
	      reject(err);
	      return;
	  }

	  let authRequest = self.getAuthRequest();

	  client.GetSales(authRequest, function (err, result) {

	      if (err) {
		reject(err);
	      } else {
		resolve(result.GetSalesResult);
	      }

	  });
        });
    });
};


/**
 * get session types
 * @returns {Promise}
 */
MindbodyLogic.prototype.getSessionTypes = function () {

    Util.log("getSessionTypes from mindbody function");

    let self = this;

    return new Promise(function (resolve, reject) {

        let url = mindbodyApiUrl + '/SiteService.asmx?wsdl';

        soap.createClient(url, self.wdsl, function (err, client) {

	  if (err) {
	      reject(err);
	      return;
	  }

	  let authRequest = self.getAuthRequest();

	  client.GetSessionTypes(authRequest, function (err, result) {

	      if (err) {
		reject(err);
	      } else {
		resolve(result.GetSessionTypesResult.SessionTypes.SessionType);
	      }

	  });
        });
    });
};

MindbodyLogic.prototype.getPrograms = function () {

    Util.log("getPrograms from mindbody function");

    let self = this;

    return new Promise(function (resolve, reject) {

        let url = mindbodyApiUrl + '/SiteService.asmx?wsdl';

        soap.createClient(url, self.wdsl, function (err, client) {

	  if (err) {
	      reject(err);
	      return;
	  }

	  let authRequest = self.getAuthRequest();

	  client.GetPrograms(authRequest, function (err, result) {

	      if (err) {
		reject(err);
	      } else {
		resolve(result.GetProgramsResult.Programs.Program);
	      }

	  });
        });
    });
};

/**
 * get client
 * @param entities - can be the name of the client
 * @returns {Promise}
 */
MindbodyLogic.prototype.getClients = function (entities) {

    Util.log("getClients from mindbody function");

    let self = this;

    return new Promise(function (resolve, reject) {

        let url = mindbodyApiUrl + '/ClientService.asmx?wsdl';

        soap.createClient(url, self.wdsl, function (err, client) {

	  if (err) {
	      reject(err);
	      return;
	  }

	  let authRequest = self.getAuthRequest();

	  if (entities.person || entities.CUSTOMER) {
	      authRequest.Request.SearchText = entities.person || entities.CUSTOMER;
	  } else {
	      authRequest.Request.SearchText = "";
	  }
	  authRequest.Request.SearchText = authRequest.Request.SearchText.trim();

	  client.GetClients(authRequest, function (err, result) {

	      if (err) {
		reject(err);
	      } else {
		resolve(result.GetClientsResult.Clients.Client);
	      }

	  });
        });
    });
};


/**
 * provide deep copy of the request body with credentials
 */
MindbodyLogic.prototype.getAuthRequest = function () {
    return JSON.parse(JSON.stringify(this.requestBody));
};

module.exports = MindbodyLogic;