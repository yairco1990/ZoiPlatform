const sinon = require('sinon');
const chai = require('chai');
const expect = require('chai').expect;
const deepcopy = require('deepcopy');
const assert = require('assert');
const MyUtils = require('../interfaces/utils');

describe("MyUtils class", () => {

	it("nestedValue function", () => {

		let obj = {
			a: {
				b: {
					c: 5

				}
			}
		};

		let result = MyUtils.nestedValue(obj, "a.b.c");

		expect(result).to.equals(5);

		obj = {};

		result = MyUtils.nestedValue(obj, "a.b.c");

		expect(result).to.equals(null);

		obj = {
			oo: {
				bb: {
					firstname: "Yair",
					lastname: "Cohen"
				}
			}
		};

		result = MyUtils.nestedValue(obj, "oo.bb.firstname");

		expect(result).to.equals("Yair");

		result = MyUtils.nestedValue(obj, "oo.bb.lastname");

		expect(result).to.equals("Cohen");

		result = MyUtils.nestedValue(obj, "oo.bb.stam");

		expect(result).to.equals(null);

		obj = {
			message: {
				attachments: [
					{
						payload: {
							url: "http://localhost:3000"
						}
					}
				]
			}
		};

		result = MyUtils.nestedValue(obj, "message.attachments[0].payload.url");

		expect(result).to.equals("http://localhost:3000");
	});

});