const program = require("commander");
const utils = require("../depends/utils");

const isValidPrivate = utils.isValidPrivate;
const publicToAddress = utils.publicToAddress;
const privateToPublic = utils.privateToPublic;
const Buffer = utils.Buffer;

program
  .version("0.1.0")
  .option("-p, --public", "generate public key")
  .option("-a, --address", "generate address")
  .action((privateKey, cmd) => {
  	privateKey = Buffer.from(privateKey, "hex");

		if(!isValidPrivate(privateKey))
   	{
			return console.error("invalid private key");
   	}

   	const publicKey = privateToPublic(privateKey);
		const address = publicToAddress(publicKey);

   	if(cmd.public)
   	{
   		return console.warn(`publicKey: ${publicKey.toString("hex")}`);
   	}

   	if(cmd.address)
   	{
   		return console.warn(`address: ${address.toString("hex")}`);
   	}
    
    console.warn(`publicKey: ${publicKey.toString("hex")}`);
    console.warn(`address: ${address.toString("hex")}`);
  });

program.parse(process.argv);