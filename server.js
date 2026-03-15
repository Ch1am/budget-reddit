const dotenv = require('dotenv');
// Specify the path to the environment variablef file 'config.env'
dotenv.config({ path: './config.env' });

const express = require("express");
const server = express();
const path = require("path");
const mongoose = require('mongoose');


// utilize routes here
const authentication = require("./routes/authentication");
const homeRoute = require("./routes/home");
const settingsRoute = require("./routes/settings.js")
const postRoutes = require('./routes/posts');

server.use("/", express.static(path.join(__dirname, "public")));
server.use(express.urlencoded({ extended: true }));
server.set("view engine", "ejs");


// use the routes you initialize above here
server.use("/", authentication);
server.use("/home", homeRoute);
server.use("/settings", settingsRoute);
server.use('/post', postRoutes);



// async function to connect to DB
async function connectDB() {
  try {
    // connecting to Database with our config.env file and DB is constant in config.env
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
  const hostname = "127.0.0.1"; // Define server hostname
  const port = 8000;// Define port number
 
  // Start the server and listen on the specified hostname and port
  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });
}

// call connectDB first and when connection is ready we start the web server
connectDB().then(startServer);