const collectionModel = require("../models/collectionModel");
const postModel = require("../models/postModel");

/**
 * Collection controller handles all "collection" features:
 * - Create / list collections
 * - Rename / delete collections
 * - Add/remove posts from a collection
 */

// GET /home/new-collection
exports.showAddCollection = (req, res) => {
	const msg = null;
	return res.render("collection/create-collection", 
		{ 
			msg, 
			result: null 
		});
};

// POST /home/new-collection
exports.addCollection = async (req, res) => {
	const title = req.body.title;

	let result = null;
	let msg = null;

	if (!title || title.trim().length == 0) {
		msg = 'Please enter a valid title'
		return res.render("collection/create-collection", { msg });
	}

	const newCollection = {
		title,
		user: req.session.user,
		posts: [],
	};

	try {
		result = await collectionModel.createCollection(newCollection);
		return res.redirect("/home/my-collection");
	} catch (error) {
		console.error(error);
		msg = "Error creating collection";
		return res.render("collection/create-collection", { result, msg });
	}
};

// GET /home/my-collection
exports.showCollections = async (req, res) => {
	let msg = null;

	try {
		let collectionList = await collectionModel.retrieveAll(req.session.user);
		// if (collectionList && collectionList.length==0) {
		//   let defaultCollection = {
		//     title : 'Favourite',
		//     user: req.session.user,
		//     posts: [],
		//   }
		//   let result = await collectionModel.createCollection(defaultCollection)
		//   collectionList = await collectionModel.retrieveAll(req.session.user)
		// }
		return res.render("collection/show-collection", { collectionList, msg });
	} catch (error) {
		console.error(error);
		return res.send("Error reading collection");
	}
};

// GET /home/collection/:title
exports.displayPostInCollection = async (req, res) => {
	const collectionTitle = req.params.title;
	try {
		if (!req.session || !req.session.user) {
		return res.redirect('/login')
		}
		const collection = await collectionModel.findByTitle(
		collectionTitle,
		req.session.user,
		);
		if (!collection) {
		console.log("Collection not found",collectionTitle);
		
		return res.redirect('/home/my-collection');
		}
		return res.render("collection/indivCollection", { collection });
	} catch (error) {
		console.error(error);
		return res.send("Error reading collection");
	}
};

// GET /home/collection/:id/rename
exports.showRenameCollection = async (req, res) => {
	let msg = null
	try {
		const collection = await collectionModel.getCollectionById(req.params.id);
		return res.render("collection/rename-collection", { collection,msg });
	} catch (error) {
		console.error(error);
		return res.send("Error reading collection");
	}
};

// POST /home/rename-collection
exports.renameCollection = async (req, res) => {
	const collectionId = req.body.collectionId;
	const newTitle = req.body.newTitle.trim();
	let msg = null

	if ( !newTitle || newTitle.length == 0) {
		msg = 'Please enter a valid title'
		const collection = await collectionModel.getCollectionById(collectionId);
		return res.render("collection/rename-collection", { collection,msg });
	}

	try {
		await collectionModel.renameCollection(collectionId, newTitle);
		return res.redirect("/home/my-collection");
	} catch (error) {
		console.error(error);
		return res.redirect("/home/my-collection");
	}
};

// POST /home/delete-collection
exports.deleteCollection = async (req, res) => {
	const collectionId = req.body.collectionId;

	try {
		await collectionModel.deleteCollection(collectionId);
		return res.redirect("/home/my-collection");
	} catch (error) {
		console.error(error);
		return res.redirect("/home/my-collection");
	}
};

// POST /home/collection/:title/remove-post
exports.removePostsFromCollection = async (req, res) => {
	const collectionTitle = req.params.title;
	const postId = req.body.postId;

	try {
		const collection = await collectionModel.findByTitle(
		collectionTitle,
		req.session.user,
		);

		if (!collection) {
			return res.redirect('/home/my-collection');
		}
		
		await collectionModel.removePostFromCollection(collection._id, postId);
		return res.redirect(`/home/collection/${collectionTitle}`);
	} catch (error) {
		console.error(error);
		return res.redirect(`/home/collection/${collectionTitle}`);
	}
};



// GET /post/:id/add-to-collection
exports.showCollectionDetails = async (req, res) => {
	const postId = req.params.id;

	try {
		const post = await postModel.getPostById(postId);
		
		if (!post) {
			return res.send(`
                This post doesn't seem to exist... You will be redirected back to the home page in 3 seconds...
                <script>
                    setTimeout(() => {
                        window.location.href = "/home";
                    }, 3000);
                </script>
            `)
		}

		let collectionList = await collectionModel.retrieveAll(req.session.user);
		if (collectionList && collectionList.length==0) {
		defaultCollection = {
			title : 'Favourite',
			user: req.session.user,
			posts: [],
		}
		result = await collectionModel.createCollection(defaultCollection)
		collectionList = await collectionModel.retrieveAll(req.session.user)
		}
		return res.render("collection/collection-selection", { collectionList, post });
	} catch (error) {
		console.error(error);
		return res.send("Error reading collection");
	}
};

// POST /post/:id/add-to-collection
exports.addInCollection = async (req, res) => {
	const postID = req.params.id;
	const selectedCollectionTitle = req.body.title;

	try {
		const collection = await collectionModel.findByTitle(
		selectedCollectionTitle,
		req.session.user,
		);
		await collectionModel.addIntoCollection(collection._id, postID);
		return res.redirect("/home/my-collection");
	} catch (error) {
		console.error(error);
		return res.redirect("/home/my-collection");
	}
};

