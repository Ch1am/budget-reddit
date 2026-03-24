const postModel = require('../models/postModel');
const timeAgo = require("../functions/timeAgo")
const User = require("../models/registerModel")
const mongoose = require('mongoose');

//displayAllPost diplays everything from newest order in the array (added last in the array)
exports.displayAllPost = async (req, res) => {
	try {

		// session check
		const session = req.session
		if (!session || !session.user) {
			return res.redirect("/login")
		}

		// user information
		const userInfo = await User.findByUserID(session.user)

		let posts = await postModel.getAllPost();
		const reversedPosts = posts.slice().reverse() //this reverse line just flips the array so the newst post is at the top
		const username = 'russell_dev'; // replace with sessionID later

    const postsWithVotes = reversedPosts.map((post) => {
      //just to test if i up/downvote, whether the button will remain highlighted
      const existingVote = post.voters.find((voter) => voter.username === username);

      //converting the img buffer to base64 string for ejs
let imageBase64 = null;
if (post.image && post.image.data) {
  imageBase64 = Buffer.from(post.image.data.buffer).toString('base64');
}
      return {
        ...post,
        userVote: existingVote ? existingVote.voteType : null,
        imageBase64,
        imageType: post.image ? post.image.contentType : null
      };
    });
    let data = req.query.query
    data = data ? data : undefined

    res.render("landing", {
      posts: postsWithVotes,
      query: data,
      timeAgo
    })
  }
  catch (error) {
    console.error(error);
    console.log('Mongoose state:', mongoose.connection.readyState);
    res.send("Error reading database " + error.message);
  }

}

// russell old upvote code
exports.upvote = async (req, res) => {
  const id = req.params.id
  const posts = await postModel.getAll();
  const post = posts.find((p) => String(p.id) === String(req.params.id));
  const username = 'russell_dev';

  if (post) {
    const existingVote = post.voters.find((v) => v.username === username);
    if (existingVote) {
      if (existingVote.voteType === 'upvote') {
        post.votes--;
        post.voters = post.voters.filter((v) => v.username !== username);
      } else {
        post.votes += 2;
        existingVote.voteType = 'upvote';
      }
    } else {
      post.voters.push({ username, voteType: 'upvote' });
      post.votes++;
    }
    await postModel.insertAll(posts);
  }
  res.redirect(`/home#post-${id}`);
};

exports.downvote = async (req, res) => {
  const id = req.params.id
  const posts = await postModel.getAll();
  const post = posts.find((p) => String(p.id) === String(req.params.id));
  const username = 'russell_dev';

  if (post) {
    const existingVote = post.voters.find((v) => v.username === username);
    if (existingVote) {
      if (existingVote.voteType === 'downvote') {
        post.votes++;
        post.voters = post.voters.filter((v) => v.username !== username);
      } else {
        post.votes -= 2;
        existingVote.voteType = 'downvote';
      }
    } else {
      post.voters.push({ username, voteType: 'downvote' });
      post.votes--;
    }
    await postModel.insertAll(posts);
  }
  res.redirect(`/home#post-${id}`);
};
exports.showAddCollection = (req,res) => {
  let msg = null
  res.render ('create-collection',{msg,result:null})
}

exports.addCollection = async (req,res) => {
  const title = req.body.title 
  
  
  let result = null
  let msg = null
  
  if (title) {
    let newCollection = {
      title: title,
      user: req.session.user,
      posts: []
    }
    try {
      const result = await postModel.createCollection(newCollection)
      console.log('mylog:' +result)
      // msg = 'Collection created successfully'
      // res.render('create-collection',{result:result, msg})
      res.redirect('/home/my-collection')
    } catch (error) {
      console.log(error)
      msg = 'Error creating collection'
      res.render('create-collection',{result:result,msg})
    }  
  }
}

exports.showCollections = async (req,res) => {
  let msg = null
  try {
    let collectionList = await postModel.retrieveAll(req.session.user)
    res.render('show-collection',{collectionList,msg})
  } catch (error) {
    console.log (error)
    res.send('Error reading collection')
  }
}

exports.displayPostInCollection = async(req,res) => {
  const collectionTitle = req.params.title
  try {
    const collection = await postModel.findByTitle(collectionTitle, req.session.user)
    res.render('indivCollection',{collection})
  } catch (error) {
    console.log(error)
  }
}

exports.renameCollection = async (req, res)=>{
  const collectionId = req.body.collectionId
  const newTitle = req.body.newTitle
  try {
    await postModel.renameCollection(collectionId, newTitle)
    res.redirect("/home/my-collection")
  } catch (error){
    console.log(error)
  }
}
exports.deleteCollection = async (req, res)=>{
  const collectionId = req.body.collectionId
  try {
    await postModel.deleteCollection(collectionId)
    res.redirect("/home/my-collection")
  } catch (error){
    console.log(error)
  }
}

exports.removePostsFromCollection = async (req, res)=>{
  const collectionTitle = req.params.title
  const postId = req.body.postId
  try {
    const collection = await postModel.findByTitle(collectionTitle, req.session.user)
    await postModel.removePostFromCollection(collection._id, postId)
    res.redirect("/home/collection/" + collectionTitle)
  } catch (error){
    console.log(error)
  }
}
exports.showRenameCollection = async (req, res)=>{
  try {
    const collection = await postModel.getCollectionById(req.params.id)
    res.render("rename-collection", {collection})
  } catch (error){
    console.log(error)
  }
}
