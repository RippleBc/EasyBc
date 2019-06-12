const _ = require("underscore")

let array = []

array.push("20e761ae5ad0a95cbe828cf48af3bc8940f9128d3d064f38a53e6794225f4e31");
array.push("f3cdd7e634f2b04abef60801932736a0a96d4de61de5400fdc67da6ededef7d1");
array.push("5145ae724abe8de3e8f2e621e6981a4765509ddebbc62590bd52718e1d488477");
array.push("d45990b3c30409ba1b132f06c0e7910e86203378b9a0588bf7830574b44e9aab");
array.push("0e7047c874bf895a31855ddb819911655bc38ea95139d1a27103e86ee441101f");
array.push("7a6397d21af7b89acb2ac6bd39dfdcdf480385dd03b34fe0b1faa1e93d78adad");
array.push("4de38acd137d2efd4018f414f3eb271f0a092b5ef15bc5f285e639c6aa823928");
array.push("1335fb9c4066aaeb30f68cadb0e8035091124ea1e143d9b751869122f900d942");
array.push("83fdccf1e4ac3d4ecab2ccfddd0e91d7021bc533c9546e9a39e69491468dd57f");
array.push("ab2ea21a11ef2c1ceabc32b72c430d50be1a771ad55bbb389930bf8908675445");
array.push("9165e6bdff3137a102623694103a6c8ee4a4f84f12b966a3103e3c92c26b4e8a");
array.push("10516195383d1397a64752c8be4da4381ade0fa8bf7d39eea218e753587acf36");
array.push("e1dadc84cfd1359e2d7c6a0654be72d3694a8592f94cb14e0304929996274d2d");
array.push("c25e741fab13e1be4677db52ba6c0428f239694cb6587cddc9a0027d8d855725");
array.push("a67683dbe2d9363b7b01ba752897fa953a5ebca6d094758322eb9c75f5bdd854");
array.push("340130b61a584f1478433ba78342b5abe362eedfb36907acd93a4893d6ab8476");
array.push("ec2b119b75720f183317985e024e2f9dea8b7c721841b20fb8d133180a109a0d");
array.push("0dcd115f94392a0b896bbb2f86f948430bd7bfc11f746f3253e6ccfd805f9de0");
array.push("3de91e2ea84d9d1c644af6f911d553d32f2b51f13b79f6498fcc3f3e7f1e694d");
array.push("276c706db9889ef81b2c50b6d65f32ae9eb546819fca9e38d1e90b9ca6c2e119");
array.push("6dbef602462b095320d43ba5397eb299aba61d332848af4854a5be79c3a36c04");







// array = array.sort((a, b) => {
//   return a > b
// })


array = _.sortBy(array, ele => {
  return ele.toString("hex")
})


console.log(array.map(e => {
  return e.toString("hex")
}))