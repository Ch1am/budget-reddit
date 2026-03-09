const postModel = require('../models/postModel');
const timeAgo = require("../functions/timeAgo") 

//displayAllPost diplays everything from newest order in the array (added last in the array)
exports.displayAllPost = async (req, res) => {
const posts = await postModel.getAll()
const reversedPosts = posts.slice().reverse() //this reverse line just flips the array so the newst post is at the top
      const username = 'russell_dev'; // replace with sessionID later
    //just to test if i up/downvote, whether the button will remain highlighted
  const postsWithVotes = reversedPosts.map((post) => {
    const existingVote = post.voters.find((voter) => voter.username === username);
    return {
      ...post,
      userVote: existingVote ? existingVote.voteType : null
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

