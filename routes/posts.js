const express = require('express');
const router = express.Router();
// TODO:
// remove placeholder testing code like mockPost and how i handle the upvote and downvote

//just testing
const mockPosts = [
  {
    id: '1',
    title: 'trump peepeepoopoo',
    imageUrl: 'https://c.ndtvimg.com/2025-06/ukbqee74_donald-trump_625x300_26_June_25.jpeg?im=FitAndFill,algorithm=dnn,width=1200,height=738',
    tag: 'murica',
    upvotes: 420,
    downvotes: 69,
    author: { username: 'russell_admin' },
    createdAt: new Date(),
    commentCount: 69420,
    voters: []
  },
  {
    id: '2',
    title: 'bomb go boom boom',
    imageUrl: 'https://media.tenor.com/jYfP3Nj30agAAAAe/kaboom-explosion.png',
    tag: 'war',
    upvotes: 150,
    downvotes: 5,
    author: { username: 'Thelegend27' },
    createdAt: new Date(),
    commentCount: 7,
    voters: []
  }
];

// GET for all memes in the main gallery
router.get('/', (req, res) => {
  const username = 'russell_dev'; // replace with session when we link up 

  const postsWithVotes = mockPosts.map((post) => {
    const existingVote = post.voters.find((voter) => voter.username === username);
return {
  id: post.id,
  title: post.title,
  imageUrl: post.imageUrl,
  tag: post.tag,
  upvotes: post.upvotes,
  downvotes: post.downvotes,
  author: post.author,
  createdAt: post.createdAt,
  commentCount: post.commentCount,
  userVote: existingVote ? existingVote.voteType : null
};
  });

  res.render('post-gallery', { posts: postsWithVotes });
    
});

// GET for post creations
router.get('/create', (req, res) => {
    res.render('post-create');
});

// GET for when user clicks into the meme to view comments etc
router.get('/view/:id', (req, res) => {
  res.render('post-gallery', {
    posts: mockPosts,
  });
});

// POST for when user clicks upvote/downvote - needs to be changed when we implement backend
router.post('/:id/vote', (req, res) => {
  const voteType = req.body.voteType;
  const post = mockPosts.find((p) => String(p.id) === String(req.params.id)); //just a placeholder way of finding which mock post the user clicks on, will be removed
  const username = 'russell_dev'; // placeholder, once we link up, change it to session user

  if (post) {

    //find if voter exists in the voter array
    const existingVote = post.voters.find((voter) => voter.username === username);

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        //if user clicks the same vote, remove the vote
        if (voteType === 'upvote') post.upvotes--;
        else post.downvotes--;
        post.voters = post.voters.filter((voter) => voter.username !== username);
      } else {
        // if user switches vote to the other option, minus from the initial vote, add to the new vote.
        if (voteType === 'upvote') { post.upvotes++; post.downvotes--; }
        else { post.downvotes++; post.upvotes--; }
        existingVote.voteType = voteType;
      }
    } else {
      // first time voting on a post
      post.voters.push({ username, voteType });
      if (voteType === 'upvote') post.upvotes++;
      else post.downvotes++;
    }
  }

  res.redirect('/posts');
});

module.exports = router;