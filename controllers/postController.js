const Post = require('../models/postModel')
const timeAgo = require("../functions/timeAgo") 

exports.getSinglePost = async (req, res) => {
  try {
    const post = await Post.getPostById(req.params.id);
    
    if (!post) {
      return res.status(404).render('post-view', { 
      post: [],
      timeAgo 
    });
    }
    
    res.render('post-view', { 
      post: post,
      timeAgo 
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error reading post');
  }
};


exports.createPost = async (req, res) => {
  const { title, image, tag, snippet } = req.body;

  const posts = await Post.getAll()
  
  const newPost = {
    id: String(posts.length + 1),
    title,
    image: image || null,
    tag: tag || null,
    snippet: snippet || '',
    author: 'guest', //replace with session ID
    votes: 0,
    voters: [],
    commentCount: 0,
    createdAt: new Date()
  };

  posts.push(newPost);
  await Post.insertAll(posts);

  res.redirect('/home');
};
