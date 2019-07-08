const a = [{
    name: "a"
}, {
    name: "b"
}]

let b = process[Symbol.for("test")] = a
console.log(a);

a[0].name = 'c';
a[1].name = 'd';
console.log(b);