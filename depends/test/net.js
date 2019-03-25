const { createClient, createServer } = require("../fly");

createServer({
	host: "localhost",
	port: 8080,
	dispatcher: function() {

	}
});

setTimeout(() => {
	createClient({
		host: "localhost",
		port: 8080,
		dispatcher: function() {

		}
	});
}, 2000)



