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

// Some environments disallow overriding DNS resolvers; don't crash if so.
try {
	const dns = require("dns");
	dns.setServers(["1.1.1.1"]);
	console.log("[startup] custom DNS servers set");
} catch (e) {
	console.error("[startup] WARNING: could not set custom DNS servers:", e);
}

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
	console.error("[startup] WARNING: missing env var SECRET (sessions will use a temporary fallback)");
}
if (!process.env.DB) {
	console.error("[startup] WARNING: missing env var DB (Mongo will not connect)");
}

const sessionSecret = process.env.SECRET || "dev-secret-do-not-use-in-prod";

// session config
server.use(session({
	name: "session",
	secret: sessionSecret,
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
		if (!process.env.DB) return;
		await mongoose.connect(process.env.DB, 
			{
				dbName: "memeit"
			}
		, {
			serverSelectionTimeoutMS: 5000,
			connectTimeoutMS: 5000,
		});
		console.log("MongoDB connected successfully");
	} catch (error) {
		console.error("MongoDB connection failed:", error);
		// On Render, the service must bind a port quickly.
		// Keep the server running so logs are visible and the port stays open.
	}
};


function startServer() {
	const port = process.env.PORT || 8000;
	
	server.listen(port, () => {
		console.log(`Server running on port ${port}`);
	});
}

startServer();
connectDB();