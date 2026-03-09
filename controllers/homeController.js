const posts = require('../data/posts.json');
const timeAgo = require("../functions/timeAgo")

exports.displayPost = (req, res) => {

      const username = 'russell_dev'; // replace with sessionID later
    //just to test if i up/downvote, whether the button will remain highlighted
  const postsWithVotes = posts.map((post) => {
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

exports.upvote = (req, res) => {
  const post = posts.find((p) => String(p.id) === String(req.params.id));
  const username = 'russell_dev'; // replace with session user later when implemented

  if (post) {
    const existingVote = post.voters.find((v) => v.username === username);
    if (existingVote) {
      if (existingVote.voteType === 'upvote') {
        // clicking upvote again = remove vote
        post.votes--;
        post.voters = post.voters.filter((v) => v.username !== username);
      } else {
        // switching from downvote to upvote
        post.votes += 2;
        existingVote.voteType = 'upvote';
      }
    } else {
      // first time voting
      post.voters.push({ username, voteType: 'upvote' });
      post.votes++;
    }
  }
  res.redirect('/home');
}

exports.downvote = (req, res) => {
  const post = posts.find((p) => String(p.id) === String(req.params.id));
  const username = 'russell_dev'; // replace with req.session.user.username later

  if (post) {
    const existingVote = post.voters.find((v) => v.username === username);
    if (existingVote) {
      if (existingVote.voteType === 'downvote') {
        // clicking downvote again = remove vote
        post.votes++;
        post.voters = post.voters.filter((v) => v.username !== username);
      } else {
        // switching from upvote to downvote
        post.votes -= 2;
        existingVote.voteType = 'downvote';
      }
    } else {
      // first time voting
      post.voters.push({ username, voteType: 'downvote' });
      post.votes--;
    }
  }
  res.redirect('/home');
}