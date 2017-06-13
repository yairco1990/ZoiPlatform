let soap = require('soap');
let fs = require('fs');
var Util = require('util');

function MindbodyLogic(authtoken) {
    this.authtoken = authtoken;
}

MindbodyLogic.prototype.getClasses = function (entities, callback) {

    Util.log("getClasses function");

    let self = this;

    let url = 'https://api.mindbodyonline.com/0_5/ClassService.asmx?wsdl';

    let wsdlOptions = self.getDefaultWsdl();

    soap.createClient(url, wsdlOptions, function (err, client) {

        let args = self.getDefaultArgs();

        client.GetClasses(args, function (err, result) {

	  Util.log(result);

	  var myResult = "";
	  result.GetClassesResult.Classes.Class.forEach(function (c) {
	      myResult += c.ClassDescription.Name + "\n";
	  });

	  callback(200, myResult);
        });
    });
};

MindbodyLogic.prototype.getSales = function (entities, callback) {

    Util.log("getSales function");

    let self = this;

    let url = 'https://api.mindbodyonline.com/0_5/SaleService.asmx?wsdl';

    let wsdlOptions = self.getDefaultWsdl();

    soap.createClient(url, wsdlOptions, function (err, client) {

        let args = self.getDefaultArgs();

        client.GetSales(args, function (err, result) {

	  Util.log(result);

	  var myResult = "";
	  result.GetSalesResult.Sales.Sale.forEach(function (s) {
	      myResult += s + "\n";
	  });

	  callback(200, myResult);
        });
    });
};

MindbodyLogic.prototype.getClients = function (entities, callback) {

    Util.log("getClients function");

    let self = this;

    let url = 'https://api.mindbodyonline.com/0_5/ClientService.asmx?wsdl';

    let wsdlOptions = self.getDefaultWsdl();

    soap.createClient(url, wsdlOptions, function (err, client) {

        let args = self.getDefaultArgs();

        if (entities.person || entities.CUSTOMER) {
	  args.Request.SearchText = entities.person || entities.CUSTOMER;
        } else {
	  args.Request.SearchText = "";
        }
        args.Request.SearchText = args.Request.SearchText.trim();

        client.GetClients(args, function (err, result) {

	  Util.log(result);

	  let myResult = "";

	  if (result.GetClientsResult.Clients) {
	      let resultClient = result.GetClientsResult.Clients.Client[0];

	      myResult += "The client that zoi found is " + resultClient.FirstName + " " + resultClient.LastName + ".";
	      if (resultClient.MobileNumber) {
		myResult += " His mobile number is " + resultClient.MobileNumber + ".";
	      }
	      if (resultClient.HomeNumber) {
		myResult += " His home phone number is " + resultClient.HomePhone + ".";
	      }
	      if (resultClient.Email) {
		myResult += " His Email is " + resultClient.Email + ".";
	      }
	      if (resultClient.City && resultClient.AddressLine1) {
		myResult += " His address is " + resultClient.AddressLine1 + ", " + resultClient.City + ".";
	      }
	      if (resultClient.Status) {
		myResult += " His status is " + resultClient.Status + ".";
	      }
	  } else {
	      myResult("Zoi didn't find client with the name " + args.Request.SearchText);
	  }

	  callback(200, myResult);
        });
    });
};

MindbodyLogic.prototype.getDefaultWsdl = function () {
    return [
        {soap_version: "SOAP_1_1"},
        {trace: true}
    ];
};

MindbodyLogic.prototype.getDefaultArgs = function () {
    return {
        Request: {
	  SourceCredentials: {
	      SourceName: "MyPatShop",
	      Password: "/F91KtIIXKfVxDr7cqs7R2VsG6g=",
	      SiteIDs: [{int: -99}]
	  },
	  UserCredentials: {
	      Username: "Siteowner",
	      Password: "apitest1234",
	      SiteIDs: [{int: -99}]
	  }
        }
    };
};

module.exports = MindbodyLogic;