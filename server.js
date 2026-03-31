const dns = require('dns');
dns.setServers(['1.1.1.1']);
const dotenv = require('dotenv');
// Prefer host-provided environment variables (e.g. Render),
// but still support local dev via config.env.
dotenv.config();
dotenv.config({ path: './config.env' });

console.log("[startup] node", process.version, "pid", process.pid);
console.log("[startup] env", {
	HAS_DB: Boolean(process.env.DB),
	HAS_SECRET: Boolean(process.env.SECRET),
	PORT: process.env.PORT || null,
	NODE_ENV: process.env.NODE_ENV || null,
});

process.on("unhandledRejection", (reason) => {
	console.error("Unhandled promise rejection:", reason);
	process.exit(1);
});

process.on("uncaughtException", (err) => {
	console.error("Uncaught exception:", err);
	process.exit(1);
});

const express = require("express");
const server = express();
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");

// utilize routes here
const authentication = require("./routes/authentication");
const homeRoute = require("./routes/home");
const collectionRoute = require("./routes/collection");
const settingsRoute = require("./routes/settings.js")
const postRoutes = require("./routes/posts");
const communityRoutes = require("./routes/community.js")
const commentRouter = require("./routes/comment");

if (!process.env.SECRET) {
	throw new Error("Missing required env var SECRET (used for sessions)");
}
if (!process.env.DB) {
	throw new Error("Missing required env var DB (Mongo connection string)");
}

// session config
server.use(session({
	name: "session",
	secret: process.env.SECRET,
	resave: false,
	saveUninitialized: false,
	cookie: {
		maxAge: 1000 * 60 * 60 * 24
	}
}))

server.use("/", express.static(path.join(__dirname, "public")));
server.use(express.urlencoded({ extended: true }));
server.set("view engine", "ejs");


// use the routes initialized
server.use("/", authentication);
server.use("/home", homeRoute);
server.use("/home", collectionRoute);
server.use("/settings", settingsRoute);
server.use("/post", postRoutes);
server.use("/community", communityRoutes)
server.use("/", commentRouter);


// async function to connect to DB
async function connectDB() {
	try {
		await mongoose.connect(process.env.DB);
		console.log("MongoDB connected successfully");
	} catch (error) {
		console.error("MongoDB connection failed:", error);
		process.exit(1);
		
	}
};


function startServer() {
	const port = process.env.PORT || 8000;
	
	server.listen(port, () => {
		console.log(`Server running on port ${port}`);
	});
}

connectDB().then(startServer);