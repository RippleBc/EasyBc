class Point
{
	constructor(x, y)
	{
		this.x = x;
		this.y = y;
	}
}

class ColorPoint extends Point
{
	constructor(x, y, color)
	{
		super(x, y);
		this.color = color;
	}

	hello()
	{
		console.log("hello");
	}
}
var p1 = new Point(2, 3);
var p2 = new ColorPoint(2, 3, 'red');

console.log(Object.getOwnPropertyDescriptors(p2.__proto__.__proto__))
console.log(Object.getOwnPropertyDescriptors(p1.__proto__))
// console.log(p2.__proto__) // false
// console.log(p2.) // true

// console.log(ColorPoint.__proto__ === Point)
// console.log(ColorPoint.prototype.__proto__ === Point.prototype)