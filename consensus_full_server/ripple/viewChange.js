class ViewChange
{
  constructor()
  {

  }

  run()
  {

  }

  /**
	 * @param {Buffer} address
	 * @param {Number} cmd
	 * @param {Buffer} data
	 */
  handleMessage(address, cmd, data) {
    assert(Buffer.isBuffer(address), `Prepare handleMessage, address should be an Buffer, now is ${typeof address}`);
    assert(typeof cmd === "number", `Prepare handleMessage, cmd should be a Number, now is ${typeof cmd}`);
    assert(Buffer.isBuffer(data), `Prepare handleMessage, data should be an Buffer, now is ${typeof data}`);

    
  }
}