let state = 2;

const loggerHandler = {
	apply: (target, ctx, args) => {
		switch(state)
		{
			case 1: 
			{
				Reflect.apply(target, {
					num: 100
				}, args)
			}
			break;

			case 2:
			{
				Reflect.apply(target, {
					num: 200
				}, args)
			}
			break;

			case 3:
			{
				Reflect.apply(target, {
					num: 300
				}, args)
			}
			break;
		}
	}
}

const proxy = new Proxy(function(args) {
	console.log(this.num + ': ' + args)
}, loggerHandler)

proxy('aaaaaaaaaaaaaaaaa');

