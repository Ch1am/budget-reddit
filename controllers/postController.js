const Post = require('../models/postModel')
const timeAgo = require("../functions/timeAgo")
const User = require("./../models/registerModel")
const Community = require("./../models/communityModel")

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
	const userID = req.session.user

	const user = await User.findByUserID(userID)
	let communities = user.communities
	const com = []

	for (const c of communities) {
        const r = await Community.findCommunityById(c);
        com.push(r);
    }

	res.render('post-create', {
		user, 
		communities: com
	})
}

exports.createPost = async (req, res) => {
	const { title, community, snippet } = req.body;

	if (!title || !snippet) {
		return res.render('post-create', { error: 'Title and description are required' });
	}

	console.log(community)
	const image = req.file ? { data: req.file.buffer, contentType: req.file.mimetype } : { data: null, contentType: null };
	const currentUser = await User.findByUserID(req.session.user) 

	const r = await Post.createPost({
		title,
		image,
		community: community == "None_Selected" ? null : community,
		snippet,
		author: currentUser ? currentUser.name : "Guest",
		votes: 0,
		voters: [],
		commentCount: 0,
		createdAt: new Date()
	});

	if (community !== "None_Selected") {
		await Community.addPostToCommunity(community, req.session.user, r._id)
	}

	console.log(r)
	if (!r) {
		res.send("An error has occured, please try again later");
	} else {
		res.redirect('/home');
	}
};
