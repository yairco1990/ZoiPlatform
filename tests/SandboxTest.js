const CryptoJS = require('crypto-js');

// describe.skip("", function () {
// 	const accessToken = 'EAAFGPKITtcEBAEHhdb6ZAFXUcjsFnMq3Nsb7ZBmtL9eBKruaCFA8wE2ffK6mGiljA3i4W7sMPJ1ZBw7aROysOZBxGExsXi4RP5x1IuvwYyybk7ZBBSUrPDyXjouSnIB1ZBzcnWHjilE79HNLPWPKplL5HmbZCgVNDiSZBrPa86QPwgZDZD';
// 	const clientSecret = '364a4ac6971784586eb91066e04d0c80';
// 	const appSecretProof = CryptoJS.HmacSHA256(accessToken, clientSecret).toString(CryptoJS.enc.Hex);
// 	console.log(appSecretProof);
// });


// describe.only("", function () {
//
//

	// let x = "are you?";
	//
	// const arr = [];
	// for (let i = 0; i < 1024; i++) {
	// 	arr[i] = 0;
	// }
	//
	// function isUnique(str) {
	// 	for (let i = 0; i < str.length; i++) {
	// 		let char = str.charAt(i);
	// 		arr[char.charCodeAt(0)]++;
	// 		if (arr[char.charCodeAt(0)] > 1) {
	// 			return false;
	// 		}
	// 	}
	// 	return true;
	// }
	//
	// console.log(isUnique(x));

	// let mat = [
	// 	[4, 3, 2, 1],
	// 	[8, 7, 6, 5],
	// 	[12, 11, 10, 9]
	// ];
	//
	// let couples = mat.map(function (arr) {
	// 	return {first: arr[0], last: arr[arr.length - 1]};
	// });
	//
	// function getMinLast() {
	// 	let minLast = couples[0].last;
	// 	couples.forEach(function (couple) {
	// 		if (minLast > couple.last) {
	// 			minLast = couple.last;
	// 		}
	// 	});
	// 	return minLast;
	// }
	//
	// function getMaxFirst() {
	// 	let maxFirst = couples[0].first;
	// 	couples.forEach(function (couple) {
	// 		if (maxFirst < couple.first) {
	// 			maxFirst = couple.first;
	// 		}
	// 	});
	// 	return maxFirst;
	// }
	//
	// // console.log(getMinLast() + " - " + getMaxFirst());
	//
	// ///////////////QUESTION 2///////////////
	// const hMat = [];
	// const n = mat.length;
	// const m = mat[0].length;
	// for (let i = 0; i < n; i++) {
	// 	hMat.push([]);
	// 	for (let j = 0; j < m; j++) {
	// 		hMat[i][j] = 0;
	// 	}
	// }
	//
	// function changeDirection(direction) {
	// 	switch (direction) {
	// 		case "right":
	// 			return "down";
	// 		case "down":
	// 			return "left";
	// 		case "left":
	// 			return "up";
	// 		case "up":
	// 			return "right";
	// 	}
	// }
	//
	// function isGoingOut(direction, i, j) {
	// 	return (direction === "right" && j + 1 === m) ||
	// 		(direction === "down" && i + 1 === n) ||
	// 		(direction === "left" && j === 0) ||
	// 		(direction === "up" && i === 0);
	// }
	//
	// const result = [];
	// let keepMoving = true;
	// let currentPoint = {i: 0, j: 0};
	// let direction = "right";
	// let changeDirectionInARow = 0;
	// result.push(mat[currentPoint.i][currentPoint.j]);
	// hMat[currentPoint.i][currentPoint.j] = 1;
	//
	// let counter = 0;
	// while (keepMoving) {
	// 	counter++;
	//
	// 	if (!isGoingOut(direction, currentPoint.i, currentPoint.j)) {
	//
	// 		let i = currentPoint.i;
	// 		let j = currentPoint.j;
	//
	// 		switch (direction) {
	// 			case "right":
	// 				j++;
	// 				break;
	// 			case "down":
	// 				i++;
	// 				break;
	// 			case "left":
	// 				j--;
	// 				break;
	// 			case "up":
	// 				i--;
	// 				break;
	// 		}
	//
	// 		if (hMat[i][j] === 0) {
	// 			currentPoint.i = i;
	// 			currentPoint.j = j;
	// 			result.push(mat[currentPoint.i][currentPoint.j]);
	// 			hMat[currentPoint.i][currentPoint.j] = 1;
	// 			changeDirectionInARow = 0;
	// 		} else {
	// 			if (changeDirectionInARow < 2) {
	// 				changeDirectionInARow++;
	// 				direction = changeDirection(direction);
	// 			} else {
	// 				keepMoving = false;
	// 			}
	// 		}
	//
	// 	} else {
	// 		direction = changeDirection(direction);
	// 	}
	// }
	//
	// console.log(result);
	// console.log("finished with " + counter + " steps");
// });