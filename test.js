const getLineAndRemain = (content) => {
	if(content === undefined)
	{
		return {

		}
	}

	let newLineIndex = content.indexOf("\r\n")
	if(newLineIndex !== -1)
	{
		return {
			line: content.substring(0, newLineIndex),
			remain: content.substring(newLineIndex + 2)
		};
	}

	newLineIndex = content.indexOf("\n")
	if(newLineIndex !== -1)
	{
		return {
			line: content.substring(0, newLineIndex),
			remain: content.substring(newLineIndex + 1)
		};
	}

	newLineIndex = content.indexOf("\r")
	if(newLineIndex !== -1)
	{
		return {
			line: content.substring(0, newLineIndex),
			remain: content.substring(newLineIndex + 1)
		};
	}

	return {
		line: null
	}
}

let content = "asdbadfadfadfadf\r\nbcafsdfef\r\n"
console.log(content)

let result = getLineAndRemain(content)
content = result.remain
console.log('line: ' + result.line)
console.log('content: ' + content)

result = getLineAndRemain(content)
content = result.remain
console.log('line: ' + result.line)
console.log('content: ' + content)

result = getLineAndRemain(content)
content = result.remain
console.log('line: ' + result.line)
console.log('content: ' + content)