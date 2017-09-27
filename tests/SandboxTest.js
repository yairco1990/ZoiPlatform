const CryptoJS = require('crypto-js');

describe("", function () {
	const accessToken = 'EAAFGPKITtcEBAEHhdb6ZAFXUcjsFnMq3Nsb7ZBmtL9eBKruaCFA8wE2ffK6mGiljA3i4W7sMPJ1ZBw7aROysOZBxGExsXi4RP5x1IuvwYyybk7ZBBSUrPDyXjouSnIB1ZBzcnWHjilE79HNLPWPKplL5HmbZCgVNDiSZBrPa86QPwgZDZD';
	const clientSecret = '364a4ac6971784586eb91066e04d0c80';
	const appSecretProof = CryptoJS.HmacSHA256(accessToken, clientSecret).toString(CryptoJS.enc.Hex);
	console.log(appSecretProof);
});


describe.only("", function () {
	// let numberOfPaly = 0;
	// let numberOfEtz = 0;
	// for (let i = 0; i < 10; i++) {
	// 	if (Math.random() < 0.5) {
	// 		numberOfPaly++;
	// 	} else {
	// 		numberOfEtz++;
	// 	}
	// }
	// console.log(numberOfEtz);
	// console.log(numberOfPaly);
	function makeRandomArray(n) {
		const arr = [];
		for (let i = 0; i < n; i++) {
			arr.push(Math.floor(Math.random() * 100));
		}
		return arr;
	}

	const n = 1000;
	for (let i = 0; i < 100; i++) {
		let array = makeRandomArray(n);
		let max = array[0];
		let min = array[0];
		let camaPeamimBadaknuHiShivyon = 0;
		array.forEach(function (number) {
			camaPeamimBadaknuHiShivyon++;
			if (number <= min) {
				min = number;
			} else {
				camaPeamimBadaknuHiShivyon++;
				if (number > max) {
					max = number;
				}
			}
		});

		const shinuyBeahuzim = 100 - (100 / (n * 2)) * camaPeamimBadaknuHiShivyon;
		// if (shinuyBeahuzim > 2) {
			console.log("min = " + min);
			console.log("max = " + max);
			console.log("camaPeamimBadaknuHiShivyon = " + camaPeamimBadaknuHiShivyon);
			console.log("CamaAhuzimYaradeti = " + shinuyBeahuzim + "%");
			console.log("");
		// }
	}
});