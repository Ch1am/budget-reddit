const Post = require('../models/postModel')
const timeAgo = require("../functions/timeAgo")
const User = require("./../models/registerModel")
const Community = require("./../models/communityModel")

exports.getSinglePost = async (req, res) => {
	try {
		const collectionList = await Post.retrieveAll()
		if (!collectionList) {
			collectionList = null
		}
		const post = await Post.getPostById(req.params.id);

		if (!post) {
			return res.status(404).render("post-view", {
				post: null,
				timeAgo
			});
		}

		let sessionUser = null;
		if (req.session && req.session.user) {
			const userInfo = await User.findByUserID(req.session.user);
			sessionUser = userInfo.name;
		}

		//converting the image
		let imageBase64 = null; //set the imgb64 to null first then
		if (post.image && post.image.data) {
			//check whether the post created has an img and whether that img has data
			try {
				//if mongoose returns any data that hasnt been .lean()
				if (Buffer.isBuffer(post.image.data)) {
					imageBase64 = post.image.data.toString("base64");
				//data stored as raw binary string, binary encoding treats each char as a byte
				} else if (typeof post.image.data === "string") {
					imageBase64 = Buffer.from(post.image.data, "binary").toString(
						"base64",
					);
				//if data is a plain object cuz of lean, using bufferFrom() just converts it back into smth we can encode
				} else if (post.image.data.buffer) {
					imageBase64 = Buffer.from(post.image.data.buffer).toString("base64");
				}
			} catch (e) {
				console.error("Image conversion error:", e.message);
			}
		}
		res.render("post-view", {
			post: {
				...post,
				imageBase64,
				imageType: post.image ? post.image.contentType : null, //if contentType exists else its null
			},
			timeAgo,
			collectionList,
			sessionUser,
		});
	} catch (error) {
		console.error(error);
		res.status(500).send("Error reading post");
	}
};

exports.getUserPost = async (req, res) => {
	try {
		if (!req.session || !req.session.user) return res.redirect("/login");

		const userInfo = await User.findByUserID(req.session.user);
		const posts = await Post.getPostsByAuthor(userInfo.name);

		res.render("myPost", { posts, timeAgo });
	} catch (error) {
		console.error(error);
		res.status(500).send("Error loading your posts");
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

	if (!r) {
		res.send("An error has occured, please try again later");
	} else {
		res.redirect('/home');
	}
};

exports.showCollectionDetails = async (req,res) => {
	try {
			const post = await Post.getPostById(req.params.id)
			console.log("THE ID RECEIVED IS:", req.params.id)
			let collectionList = await Post.retrieveAll(req.session.user)
			res.render('collection-selection',{collectionList,post})
		} catch (error) {
			console.log (error)
			console.log("THE ID RECEIVED IS:", req.params.id)
			res.send('Error reading collection')
		}
}

exports.addInCollection = async (req,res)=> {
	try {
		let postID = req.params.id
		console.log("THE ID RECEIVED IS:", req.params.id);
		let selectedCollection = req.body.title
		// let msg = null
		let collectionID = await Post.findByTitle(selectedCollection, req.session.user)
		await Post.addIntoCollection(collectionID._id,postID)
		// let collectionList = await Post.retrieveAll()
		// if (!result) {
		// 	msg = 'Post is already in collection.'
		// } else {
		// 	msg = 'Post has been successfully added to collection'
		// }
		// res.render('show-collection', {collectionList,msg})
		res.redirect('/home/my-collection')
	} catch (error) {
		console.log(error)
	}
}

// exports.newCollection = async (req,res) => {
	
//   const title = req.body.title
//   try {
// 	const savedCollection = Post.createCollection(title,[])
// 	let msg = 'Collection created successfully'
//   } catch (error) {
// 	console.log(error)
// 	let msg = 'Error creating collection'
//   }
//   res.alert(msg)

// }

exports.getEditPost = async (req, res) => {
	if (!req.session || !req.session.user) return res.redirect("/login");

	const post = await Post.getPostById(req.params.id);
	const userInfo = await User.findByUserID(req.session.user);

	if (post.author !== userInfo.name)
		return res.redirect(`/post/${req.params.id}`);

	res.render("post-edit", { post });
};

exports.editPost = async (req, res) => {
	if (!req.session || !req.session.user) return res.redirect("/login");
	const post = await Post.getPostById(req.params.id);
	const userInfo = await User.findByUserID(req.session.user);

	if (post.author !== userInfo.name)
		return res.redirect(`/post/${req.params.id}`);

	const { title, snippet, tag } = req.body;
	await Post.updatePost(req.params.id, { title, snippet, tag });
	res.redirect(`/post/${req.params.id}`);
};

exports.deletePost = async (req, res) => {
	if (!req.session || !req.session.user) return res.redirect("/login");
	const post = await Post.getPostById(req.params.id);
	const userInfo = await User.findByUserID(req.session.user);

	if (post.author !== userInfo.name)
		return res.redirect(`/post/${req.params.id}`);

	await Post.deletePost(req.params.id);
	res.redirect("/home");
};
