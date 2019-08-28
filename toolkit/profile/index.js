const keyPiar = require("./keyPiar.json");
const { fork } = require('child_process');

/**
 * @param {Array} urls
 */
module.exports = async (urls) => {  
  startProfile(urls, [{
    privateKey: "ed09a7280c5a0d3c04839ca5603fe507b4d1d4572601e62aadafd923f55f7bf9",
    address: "21d21b68ded27ce2ef619651d382892c1f77baa4"
  }], keyPiar).catch(e => {
    console.fatal(e);

    process.exit(1);
  })

  for (let i = 0; i < keyPiar.length; i += 10)
  {
    const child = fork("./startProfile");
    child.send({
      urls: urls,
      selfKeyPairs: keyPiar.slice(i, i + 10),
      targetKeyPairs: [...keyPiar.slice(0, i), ...keyPiar.slice(i + 10, keyPiar.length)]
    });

    child.on("message", ({err}) => {
      console.fatal(`child ${i/10 + 1} exited, ${err}`);
    })
  }
}
