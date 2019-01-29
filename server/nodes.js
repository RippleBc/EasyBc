const util = require("../utils")
const async = require("async")

const nodeList = [
	{
		"url": "http://localhost:8080",
		"address": "0x"
	},
	{
		"url": "http://localhost:8081",
		"address": "0x"
	},
	{
		"url": "http://localhost:8082",
		"address": "0x"
	},
	{
		"url": "http://localhost:8083",
		"address": "0x"
	},
	{
		"url": "http://localhost:8084",
		"address": "0x"
	}
];

module.exports.privateKey = "0x";


module.exports.getNodeNum = function()
{
	return nodeList.length;
}

/**
 * @param {Buffer} address
 */
module.exports.checkNodeAddress = function(address)
{
	let hexStringAddress = util.baToHexString(address);

	for(let i = 0; i < module.exports.nodeList.length; i++)
	{
		if(hexStringAddress === module.exports.nodeList[i].address)
		{
			return true;
		}
	}

	return false;
}

/**
 * @param {Array} addressArray
 * @return {Boolean} 
 */
module.exports.checkIfAllNodeHasMet = function(addressArray)
{
	for(let i = 0; i < module.exports.nodeList.length; i++)
	{
		for(let j = 0; j < addressArray.length; j++)
		{
			if(module.exports.nodeList[i] === addressArray[j])
			{
				continue;
			}
		}

		if(j === addressArray.length)
		{
			return false;
		}
	}

	return true;
}