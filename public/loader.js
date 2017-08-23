var APP_VERSION = document.getElementById("loader-file").getAttribute("version");

var cssStartTime = new Date().valueOf();

Promise.all([

	//FONTS
	loadFile('https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css', 'css', null, true),
	loadFile('https://fonts.googleapis.com/css?family=Lato', 'css', null, true),
	loadFile('node_modules/ionicons/dist/css/ionicons.css', 'css', null, true),
	//END OF FONTS

	//STYLES
	loadFile('https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css', 'css', null, true),
	loadFile('src/assets/css/styles.css', 'css'),
	loadFile('https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.5.2/animate.min.css', 'css', null, true),
	loadFile('https://ajax.googleapis.com/ajax/libs/angular_material/1.1.0/angular-material.min.css', 'css', null, true),
	loadFile('node_modules/angular-material-time-picker/dist/md-time-picker.css', 'css'),

	//DIRECTIVES
	loadFile('src/directives/integration-element/integration-element.css', 'css'),

	//PAGES
	loadFile('src/pages/agenda/agenda.css', 'css'),
	loadFile('src/pages/old-customers/old-customers.css', 'css'),
	loadFile('src/pages/settings/settings.css', 'css'),
	loadFile('src/pages/account/account.css', 'css'),
	loadFile('src/pages/abilities/abilities.css', 'css'),
	loadFile('src/pages/profile/profile.css', 'css'),
	loadFile('src/pages/integrations/integrations.css', 'css'),
	loadFile('src/pages/appointment-sum/appointment-sum.css', 'css'),
	loadFile('src/pages/mail/mail.css', 'css'),
	loadFile('src/pages/settings/brief-time-popup/brief-time-popup.css', 'css'),
	loadFile('src/pages/settings/default-calendar-popup/default-calendar-popup.css', 'css'),
	loadFile('src/pages/settings/old-customers-popup/old-customers-popup.css', 'css'),
	loadFile('src/pages/settings/customers-send-limit-popup/customers-send-limit-popup.css', 'css'),
	loadFile('src/pages/settings/prompt-welcome-popup/prompt-welcome-popup.css', 'css'),
	loadFile('src/pages/404/404.css', 'css'),
]).then(function () {

	//TODO change to min
	return loadFile('https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.5.5/angular.min.js', 'js', null, false);

}).then(function () {

	var scriptsStartTime = new Date().valueOf();

	console.debug("finish to load css files. " + (scriptsStartTime - cssStartTime) + " ms");

	Promise.all([

		//START OF NPM LIBRARIES
		loadFile('https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.min.js', 'js', null, false),
		loadFile('https://cdnjs.cloudflare.com/ajax/libs/angular-ui-router/0.3.2/angular-ui-router.min.js', 'js', null, false),
		loadFile('https://ajax.googleapis.com/ajax/libs/angularjs/1.5.5/angular-animate.min.js', 'js', null, false),
		loadFile('https://ajax.googleapis.com/ajax/libs/angularjs/1.5.5/angular-aria.min.js', 'js', null, false),
		loadFile('https://cdnjs.cloudflare.com/ajax/libs/angular-messages/1.5.5/angular-messages.min.js', 'js', null, false),
		loadFile('https://ajax.googleapis.com/ajax/libs/angular_material/1.1.0/angular-material.min.js', 'js', null, false),
		loadFile('node_modules/angular-material-time-picker/dist/md-time-picker.js', 'js'),
		loadFile('https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js', 'js', null, true),
		loadFile('https://cdnjs.cloudflare.com/ajax/libs/angular-ui-bootstrap/2.4.0/ui-bootstrap.min.js', 'js', null, true),
		loadFile('https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.17.1/moment.min.js', 'js', null, false),
		loadFile('https://cdnjs.cloudflare.com/ajax/libs/moment-timezone/0.5.13/moment-timezone-with-data-2012-2022.min.js', 'js', null, false),
		loadFile('node_modules/iso-currency/dist/isoCurrency.min.js', 'js'),
		//END OF NPM

		// SERVICES
		loadFile('src/utils/utils.js', 'js'),
		loadFile('src/services/config.js', 'js'),
		loadFile('src/services/ZoiApi.js', 'js'),
		// END OF SERVICES

		//DIRECTIVES
		loadFile('src/directives/integration-element/integration-element.js', 'js'),

		// CONTROLLERS
		loadFile('src/pages/settings/brief-time-popup/brief-time-popup.js', 'js'),
		loadFile('src/pages/settings/default-calendar-popup/default-calendar-popup.js', 'js'),
		loadFile('src/pages/settings/old-customers-popup/old-customers-popup.js', 'js'),
		loadFile('src/pages/settings/customers-send-limit-popup/customers-send-limit-popup.js', 'js'),
		loadFile('src/pages/settings/prompt-welcome-popup/prompt-welcome-popup.js', 'js'),
		loadFile('src/pages/integrations/integrations.js', 'js'),
		loadFile('src/pages/settings/settings.js', 'js'),
		loadFile('src/pages/agenda/agenda.js', 'js'),
		loadFile('src/pages/account/account.js', 'js'),
		loadFile('src/pages/abilities/abilities.js', 'js'),
		loadFile('src/pages/profile/profile.js', 'js'),
		loadFile('src/pages/old-customers/old-customers.js', 'js'),
		loadFile('src/pages/appointment-sum/appointment-sum.js', 'js'),
		loadFile('src/pages/mail/mail.js', 'js'),
		loadFile('src/pages/404/404.js', 'js'),
		loadFile('src/app.js', 'js')
		//END OF CONTROLLERS

	]).then(function () {

		var scriptsEndTime = new Date().valueOf();

		console.debug("finish to load script files. " + (scriptsEndTime - scriptsStartTime) + " ms");
		console.debug("total loader time - " + (scriptsEndTime - cssStartTime) + " ms");

		angular.bootstrap(document, ['ZoiClient']);
	});
});

/**
 *
 * @param path the path to the file (could be local or remote path/url)
 * @param fileType currently supported file types are "js" and "css"
 * @param args attributes that we want to add to the file
 * @returns native promise object (if supported by browser)
 */
function loadFile(path, fileType, args, disableVersion) {
	if (path && typeof path == "string" && path.length > 0 && fileType && typeof fileType == "string" && fileType.length > 0) {

		//check if need to add version number to the path
		if (disableVersion == undefined || disableVersion == null) {
			path += "?version=" + APP_VERSION;
		}

		var file;

		switch (fileType) {
			case "js": //if path is a external JavaScript file
				file = document.createElement('script');
				file.setAttribute("type", "text/javascript");
				file.setAttribute("src", path);
				file.async = false;
				break;
			case "css": //if path is an external CSS file
				file = document.createElement("link");
				file.setAttribute("rel", "stylesheet");
				file.setAttribute("type", "text/css");
				file.setAttribute("href", path);
				file.async = true;
				break;
			default:
				throw Error("failed to load file due to: unsupported fileType - " + fileType + ".");
		}

		if (file) {

			//add args
			if (args) {
				for (var arg in args) {
					if (args.hasOwnProperty(arg)) {
						file.setAttribute(arg, args[arg]);
					}
				}
			}

			//append the file to the head element
			document.getElementsByTagName("head")[0].appendChild(file);

			//if promise exist
			if (Promise) {

				return new Promise(function (resolve, reject) {

					if (file.readyState) {  //IE
						file.onreadystatechange = function () {
							if (file.readyState == "loaded" ||
								file.readyState == "complete" ||
								file.readyState == 4) {

								file.onreadystatechange = null;

								var data = fileType == "html" ? this.responseText : undefined;

								resolve(data);
							}
						};
					} else {  //Others
						file.onload = function () {

							resolve();
						};

						file.onerror = function () {
							resolve();
						};
					}
				});
			}
		}

	} else {
		throw Error("failed to load file due to: invalid parameters.");
	}
}