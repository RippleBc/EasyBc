#!/usr/bin/env node

const program = require("commander");

program.version("1.0.0")
	.usage("<command>")
	.command("gpr", "生成私钥，公钥，地址")
	.command("gpua <privateKey>", "根据私钥生成公钥和地址")
	.parse(process.argv);