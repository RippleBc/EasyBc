var twice = {
  apply (target, ctx, args) {
    console.log('aaaaa');
  }
};
function sum (left, right) {
  return left + right;
};
var proxy = new Proxy(sum, twice);
console.log(proxy(1, 2)) // 6
console.log(proxy.call(null, 5, 6)) // 22
console.log(proxy.apply(null, [7, 8])) // 30