let SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
let fs = require('fs');
let ffmpeg = require('fluent-ffmpeg');
let Util = require('util');

module.exports = function (audioSource) {

	return new Promise(function (resolve, reject) {

		let params = {
			config: {
				encoding: 'FLAC',
				languageCode: 'en-US',
				sampleRateHertz: 44100
			},
			singleUtterance: true,
			interimResults: false
		};


		// [START speech_quickstart]
		// Imports the Google Cloud client library
		const Speech = require('@google-cloud/speech');

		// Your Google Cloud Platform project ID
		const projectId = '283013338186';

		// Instantiates a client
		const speechClient = Speech({
			projectId: projectId
		});

		let stream = ffmpeg(audioSource)
			.format("flac")
			// Specify audio bitrate in kbps (the 'k' is optional)
			.withAudioBitrate('128k')
			// Specify the number of audio channels
			.withAudioChannels(1)
			// Specify the audio sample frequency
			.withAudioFrequency(44100)
			.pipe(speechClient.createRecognizeStream(params));


		stream.on('error', function (err) {
			console.error(err);
			reject(err);
		});
		stream.on('data', function (data) {
			Util.log(data);
			resolve(data.results);
		});


		// IBM THE LOSERS!!
		// let speech_to_text = new SpeechToTextV1({
		//  url: "https://stream.watsonplatform.net/speech-to-text/api",
		//  username: "825cbe9d-1915-42ab-a095-274511659a46",
		//  password: "lc2wVySRc47N"
		// });
		//
		// let readStream = ffmpeg(audioSource).format("wav")
		//  .withAudioCodec('libmp3lame')
		//  // Specify audio bitrate in kbps (the 'k' is optional)
		//  .withAudioBitrate('128k')
		//  // Specify the number of audio channels
		//  .withAudioChannels(2)
		//  // Specify the audio sample frequency
		//  .withAudioFrequency(48000)
		//  .pipe(speech_to_text.createRecognizeStream({content_type: 'audio/l16; rate=44100'}));
		//
		//
		// let chunks = [];
		// readStream.on("data", function (chunk) {
		//  chunks.push(chunk);
		// });
		//
		// // Send the buffer or you can put it into a var
		// readStream.on("end", function () {
		//  let result = Buffer.concat(chunks).toString();
		//  console.log(result);
		//  resolve(result);
		// });
	});
};

