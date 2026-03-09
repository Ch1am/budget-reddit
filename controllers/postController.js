
exports.createPost = (req, res) => {
  const { title, image, tag, snippet } = req.body;
  const newPost = {
    id: String(posts.length + 1),
    title,
    image: image || null,
    tag,
    snippet,
    author: 'russell_dev', // replace with session later
    votes: 0,
    voters: [],
    commentCount: 0,
    createdAt: new Date()
  };
  posts.push(newPost);
  res.redirect('/home');
}