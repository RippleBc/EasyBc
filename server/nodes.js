const util = require("../utils")
const async = require("async")

// node info
module.exports.nodeList = [
	{
		"url": "http://localhost:8080",
		"address": "0xca9be7fb7862aa5def7d322766a2cc01eceadeed" // "0xfffcfc72975ef9963e5cf1649a5819f6869dee32cf8a92c66b88d97f809c8f55"
	},
	{
		"url": "http://localhost:8081",
		"address": "0xc1394e7a9b7f022e57e50490ab9b6af6cb0282dc" // "0x0138d51bbfc8ebf5d326d4b902b4596941d7e4f63ae6dd012c6ad657223b7aea"
	}
];

// network
module.exports.localHost = "";
module.exports.port = 8080;

// hex string account
module.exports.privateKey = "0xfffcfc72975ef9963e5cf1649a5819f6869dee32cf8a92c66b88d97f809c8f55";
module.exports.address = "0xca9be7fb7862aa5def7d322766a2cc01eceadeed";

// buffer account
module.exports.bfPrivateKey = util.toBuffer(module.exports.privateKey);
module.exports.bfAddress = util.toBuffer(module.exports.address);


module.exports.getNodeNum = function()
{
	return module.exports.nodeList.length;
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
 * @param {Array\Buffer} addressArray
 * @return {Boolean} 
 */
module.exports.checkIfAllNodeHasMet = function(addressArray)
{
	let i, j;

	for(i = 0; i < module.exports.nodeList.length; i++)
	{
		for(j = 0; j < addressArray.length; j++)
		{
			if(module.exports.nodeList[i].address === util.baToHexString(addressArray[j]))
			{
				break;
			}
		}

		if(j === addressArray.length)
		{
			return false;
		}
	}

	return true;
}