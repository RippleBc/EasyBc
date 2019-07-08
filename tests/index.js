let a = process[Symbol.for("test")] = [{
    name: "a"
}, {
    name: "b"
}]
console.log(a);

process[Symbol.for("test")] = [{
    name: "c"
}, {
    name: "d"
}]
console.log(a);