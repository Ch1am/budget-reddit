const fs = require("node:fs/promises");
const path = require("path");
const postsPath = path.join(__dirname, "../data/posts.json");
const mongoose = require("mongoose");

//Function getAll retrieves all data in posts.json || needs to be updated when move over to MongoDB
const getAll = async () => {
    const data =  await fs.readFile(postsPath, "utf-8");
    return JSON.parse(data);
};

//Function insertAll takes in array of posts, converts into Json strings and writes to posts.json || needs to be updated when move over to MongoDB
const insertAll = async (posts) =>{
    const jsonData = JSON.stringify(posts, null, 2);
    await fs.writeFile(postsPath, jsonData);
}

module.exports = { getAll, insertAll };
