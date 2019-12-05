const assert = require("assert");
const stream = require('stream');
const log4js= require("./logConfig");

const READ_SIZE = 1000;

const logger = log4js.getLogger("logParse");

class ReadLine {
	/**
	 * @param input 
	 */
	constructor({ input })
	{
		assert(input instanceof stream.Readable, `input should be an Readable stream, now is ${typeof input}`)

		this.stringBuffer = ''

		input.setEncoding('utf8');
		input.pause();

		input.on('end', () => {
			this.end = true;
		});
		
		this.end = false;
		this.input = input;
	}

	/**
	 * @return {Object}
	 */
	async readLine() {
		do
		{
			let { line, remain, num } = getLineAndRemain(this.stringBuffer)

			if(line) {
				this.stringBuffer = remain;

				return {
					line,
					num
				};
			}

			const chunkString = this.input.read(READ_SIZE);
			if(chunkString === null)
			{
				if(this.end)
				{
					return {
						line: null
					};
				}
				else
				{
					await new Promise((resolve, reject) => {
						setTimeout(() => {
							resolve()
						}, 2000);
					})
					continue;
				}
			}

			this.stringBuffer += chunkString;
		} 
		while(true);
	}
}

/**
 * @param {String} content
 * @return {Object}
 *   @prop {String} line
 *   @prop {String} remain
 * 	 @prop {Number} num
 */
const getLineAndRemain = content => {
	assert(typeof content === 'string', `ReadLine getLineAndRemain, content should be a String, now is ${typeof content}`)

	// find newline symbol
	newLineIndex = content.indexOf(os.EOL);

	//
	if(newLineIndex !== -1)
	{
		const line = content.substring(0, newLineIndex)
		return {
			num: line.length + os.EOL.length,
			line: line,
			remain: content.substring(newLineIndex + os.EOL.length)
		};
	}
}

module.exports = {
	createInterface: ({input}) => {
		return new ReadLine({input});
	}
}