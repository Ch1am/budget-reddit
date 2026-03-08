const express = require('express');
const router = express.Router();

//just testing
const mockPosts = [
  {
    _id: '1',
    title: 'When the code finally compiles after 3 hours',
    imageUrl: 'https://imgur.com/gallery/confused-meme-UZzDH',
    tag: 'Coding',
    upvotes: 420,
    downvotes: 10,
    author: { username: 'russell_dev' },
    createdAt: new Date(),
    commentCount: 23
  },
  {
    _id: '2',
    title: 'Monday morning energy',
    imageUrl: 'https://imgur.com/gallery/probably-xI2g8L4',
    tag: 'Relatable',
    upvotes: 150,
    downvotes: 5,
    author: { username: 'legend27' },
    createdAt: new Date(),
    commentCount: 7
  }
];

// GET for all memes in the main gallery
router.get('/', (req, res) => {
    res.render('post-gallery', { posts: [] }); // empty for now
});

// GET for post creations
router.get('/create', (req, res) => {
    res.render('post-create');
});

// GET for when user clicks into the meme to view comments etc
router.get('/view/:id', (req, res) => {
  res.render('post-gallery', {
    posts: mockPosts,
    user: { username: 'russell_dev' },  // simulate logged in user
    sort: req.query.sort || 'hot',
    currentPage: 1,
    totalPages: 1
  });
});

module.exports = router;