const express = require("express");
const path = require("path");

const app = express();
app.use("/", express.static(path.join(__dirname + "/dist")));

const server = app.listen(8080, function() {
    let host = server.address().address;
    let port = server.address().port;
    console.log("server listening at http://%s:%s", host, port);
});