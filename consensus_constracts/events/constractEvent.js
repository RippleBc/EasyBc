const utils = require("../../depends/utils");

const sha256 = utils.sha256;
const rlp = utils.rlp;

class ConstractEvent 
{
  constructor()
  {

  }

  /**
   * @return {Buffer}
   */
  hash() {
    return sha256(rlp.encode(this.raw));
  }
}

module.exports = ConstractEvent;