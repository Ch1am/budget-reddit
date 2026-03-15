const Post = require('../models/postModel')

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
