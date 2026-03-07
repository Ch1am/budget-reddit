const express = require("express");
const server = express();
const path = require("path");


// utilize routes here
const authentication = require("./routes/authentication");
const homeRoute = require("./routes/home");
const settingsRoute = require("./routes/settings.js")

server.use("/", express.static(path.join(__dirname, "public")));
server.use(express.urlencoded({ extended: true }));
server.set("view engine", "ejs");


// use the routes you initialize above here
server.use("/", authentication);
server.use("/home", homeRoute);
server.use("/settings", settingsRoute);

const hostname = "127.0.0.1";
const port = 8000;

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
