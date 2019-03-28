const levelup = require("levelup");
const leveldown = require("leveldown");
const path = require("path");

const dbDir = leveldown(path.join(__dirname, "./data"));
const db = levelup(dbDir);

describe("check db", function() {
	it("test get", (done) => {
		const checkGet = async function()
		{
			const value = await db.get("a");

			return value;
		}

		checkGet().then(value => {
			done("value should not exist");
		}).catch(e => {
			done();
		});
	});
})

