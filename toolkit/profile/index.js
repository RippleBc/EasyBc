const keyPiar = require("./keyPiar.json");
const { fork } = require('child_process');
const path = require("path");

var g_childs = [];

/**
 * @param {Array} urls
 * @param {Number} range
 */
module.exports = async (urls, range) => { 
  const mainChild = fork(path.join(__dirname, "./startProfile"));
  mainChild.send({
    urls: urls,
    selfKeyPairs: [{
      privateKey: "ed09a7280c5a0d3c04839ca5603fe507b4d1d4572601e62aadafd923f55f7bf9",
      address: "21d21b68ded27ce2ef619651d382892c1f77baa4"
    }],
    targetKeyPairs: keyPiar
  });

  mainChild.on("message", ({ err }) => {
    console.error(`main child exited, ${err}`);
  });

  for (let i = 0; i < keyPiar.length; i += range)
  {
    const child = fork(path.join(__dirname, "./startProfile"));
    child.send({
      urls: urls,
      selfKeyPairs: keyPiar.slice(i, i + range),
      targetKeyPairs: [...keyPiar.slice(0, i), ...keyPiar.slice(i + range, keyPiar.length)]
    });

    child.on("message", ({err}) => {
      console.error(`child ${i/range + 1} exited, ${err}`);
    })

    g_childs.push(child);
  }
}
