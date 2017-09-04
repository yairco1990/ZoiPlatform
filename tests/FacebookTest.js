const FacebookLogic = require('../logic/FacebookLogic');


describe("test facebook graph api", () => {
    it.only("post on fb", async () => {
        let response = await FacebookLogic.test("1651444801564063");
    })
});