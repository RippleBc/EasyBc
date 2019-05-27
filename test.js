class B {
	constructor()
	{

	}

	say() {
		console.log("hello")
	}
}

class A extends B {
	constructor()
	{
		super()
	}

	say() {
		super.say();
		console.log(" world")
	}
}




(new A()).say();