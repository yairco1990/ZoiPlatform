var APP_VERSION = document.getElementById("loader-file").getAttribute("version");

var cssStartTime = new Date().valueOf();

Promise.all([

	//FONTS
	loadFile('node_modules/font-awesome/css/font-awesome.min.css', 'css'),
	loadFile('src/assets/fonts/open_sans_hebrew/OpenSansHebrew.css', 'css'),
	loadFile('https://fonts.googleapis.com/css?family=Lato', 'css', null, true),
	loadFile('node_modules/ionicons/dist/css/ionicons.css', 'css', null, true),
	//END OF FONTS

	//STYLES
	loadFile('node_modules/bootstrap/dist/css/bootstrap.min.css', 'css'),
	loadFile('src/assets/css/styles.css', 'css'),
	loadFile('src/assets/css/animate.css', 'css'),
	loadFile('https://ajax.googleapis.com/ajax/libs/angular_material/1.1.0/angular-material.min.css', 'css', null, true),

	//DIRECTIVES
	loadFile('src/directives/integration-element/integration-element.css', 'css'),

	//PAGES
	loadFile('src/pages/agenda/agenda.css', 'css'),
	loadFile('src/pages/old-customers/old-customers.css', 'css'),
	loadFile('src/pages/account/account.css', 'css'),
	loadFile('src/pages/abilities/abilities.css', 'css'),
	loadFile('src/pages/profile/profile.css', 'css'),
	loadFile('src/pages/integrations/integrations.css', 'css'),
	loadFile('src/pages/appointment-sum/appointment-sum.css', 'css'),
	loadFile('src/pages/mail/mail.css', 'css')
]).then(function () {

	return loadFile('node_modules/angular/angular.min.js', 'js');

}).then(function () {

	var scriptsStartTime = new Date().valueOf();

	console.debug("finish to load css files. " + (scriptsStartTime - cssStartTime) + " ms");

	Promise.all([

		//START OF NPM LIBRARIES
		loadFile('node_modules/jquery/dist/jquery.min.js', 'js'),
		loadFile('node_modules/angular-ui-router/release/angular-ui-router.min.js', 'js'),
		// loadFile('node_modules/angular-mocks/angular-mocks.js', 'js'),
		loadFile('https://ajax.googleapis.com/ajax/libs/angularjs/1.5.5/angular-animate.min.js', 'js', null, false),
		loadFile('https://ajax.googleapis.com/ajax/libs/angularjs/1.5.5/angular-aria.min.js', 'js', null, false),
		loadFile('https://ajax.googleapis.com/ajax/libs/angular_material/1.1.0/angular-material.min.js', 'js', null, false),
		loadFile('node_modules/angular-translate/dist/angular-translate.min.js', 'js'),
		loadFile('node_modules/angular-translate-loader-static-files/angular-translate-loader-static-files.min.js', 'js'),
		loadFile('node_modules/bootstrap/dist/js/bootstrap.min.js', 'js'),
		loadFile('node_modules/angular-ui-bootstrap/dist/ui-bootstrap.js', 'js'),
		loadFile('node_modules/angular-resource/angular-resource.min.js', 'js'),
		loadFile('node_modules/moment/min/moment.min.js', 'js'),
		loadFile('node_modules/moment-timezone/builds/moment-timezone.min.js', 'js'),
		loadFile('node_modules/moment/locale/he.js', 'js'),
		//END OF NPM

		// SERVICES
		loadFile('src/utils/utils.js', 'js'),
		loadFile('src/services/config.js', 'js'),
		loadFile('src/services/ZoiApi.js', 'js'),
		// END OF SERVICES

		//DIRECTIVES
		loadFile('src/directives/integration-element/integration-element.js', 'js'),

		// CONTROLLERS
		loadFile('src/pages/integrations/integrations.js', 'js'),
		loadFile('src/pages/agenda/agenda.js', 'js'),
		loadFile('src/pages/account/account.js', 'js'),
		loadFile('src/pages/abilities/abilities.js', 'js'),
		loadFile('src/pages/profile/profile.js', 'js'),
		loadFile('src/pages/old-customers/old-customers.js', 'js'),
		loadFile('src/pages/appointment-sum/appointment-sum.js', 'js'),
		loadFile('src/pages/mail/mail.js', 'js'),
		loadFile('src/pages/integrations/mindbody-popup/mindbody-popup.js', 'js'),
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