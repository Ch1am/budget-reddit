const Post = require('../models/postModel')
const timeAgo = require("../functions/timeAgo")

exports.getSinglePost = async (req, res) => {
  try {
    const post = await Post.getPostById(req.params.id);

    if (!post) {
      return res.status(404).render('post-view', {
        post: null,
        timeAgo
      });
    }
    //converting the image 
    let imageBase64 = null; //set the imgb64 to null first then
    if (post.image && post.image.data) { //check whether the post created has an img and whether that img has data
      try {
        //if mongoose returns any data that hasnt been .lean()
        if (Buffer.isBuffer(post.image.data)) {
          imageBase64 = post.image.data.toString('base64');
          //data stored as raw binary string, binary encoding treats each char as a byte
        } else if (typeof post.image.data === 'string') {
          imageBase64 = Buffer.from(post.image.data, 'binary').toString('base64');
          //if data is a plain object cuz of lean, using bufferFrom() just converts it back into smth we can encode
        } else if (post.image.data.buffer) {
          imageBase64 = Buffer.from(post.image.data.buffer).toString('base64');
        }
      } catch (e) {
        console.error('Image conversion error:', e.message);
      }
    }
res.render('post-view', {
  post: {
    ...post,
    imageBase64,
    imageType: post.image ? post.image.contentType : null //if contentType exists else its null
  },
  timeAgo
});

  } catch (error) {
    console.error(error);
    res.status(500).send('Error reading post');
  }
};

exports.getCreatePost = async (req, res) => {
  res.render('post-create')
}

exports.createPost = async (req, res) => {
  const { title, tag, snippet } = req.body;

  if (!title || !snippet) {
    return res.render('post-create', { error: 'Title and description are required' });
  }

  const image = req.file ? { data: req.file.buffer, contentType: req.file.mimetype } : { data: null, contentType: null };

  await Post.createPost({
    title,
    image,
    tag: tag || null,
    snippet,
    author: 'guest', //replace with session ID
    votes: 0,
    voters: [],
    commentCount: 0,
    createdAt: new Date()
  });
  res.redirect('/home');

};
