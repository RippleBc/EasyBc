const assert = require("assert");

class Message
{
	constructor(data)
	{
		assert(typeof data.cmd === "number", `Message constructor, cmd should be a Number, now is ${typeof data}`);
		assert(typeof data.cmd === "number", `Message constructor, cmd should be a Number, now is ${typeof data}`);
		
		this.cmd = data.cmd;
		this.data = data.data;
	}
}