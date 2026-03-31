const dns = require('dns');
dns.setServers(['1.1.1.1']);
const dotenv = require('dotenv');
// Prefer host-provided environment variables (e.g. Render),
// but still support local dev via config.env.
dotenv.config();
dotenv.config({ path: './config.env' });

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
		console.error("MongoDB connection failed:", error.message);
		require('dotenv').config();
		console.log('URI:', process.env.MONGO_URI);
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