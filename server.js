const express = require("express");
const server = express();
const path = require("path");


// utilize routes here
const testRoute = require("./routes/testRoute");

server.use("/", express.static(path.join(__dirname, "public")));
server.use(express.urlencoded({ extended: true }));
server.set("view engine", "ejs");


// use the routes you initialize above here
server.use("/test-route", testRoute);

const hostname = "127.0.0.1";
const port = 8000;

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
