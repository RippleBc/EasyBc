var twice = {
  apply (target, ctx, args) {
    return Reflect.apply(...arguments, targe);
  }
};
async function sum (left, right) {
  return left + right;
};
var proxy = new Proxy(sum, twice);

proxy(1, 2).then(a => {
	console.log(a)
})

proxy.call(null, 5, 6).then(a => {
	console.log(a)
}) // 22
proxy.apply(null, [7, 8]).then(a => {
	console.log(a)
}) // 30