const mongoose = require("mongoose");
const postModel = require("./postModel");

const voterSchema = new mongoose.Schema(
	{
		username: String,
		voteType: String,
	},
	{ _id: false },
);

const collectionSchema = new mongoose.Schema({
	title: { type: String, required: true },
	user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }]
});

const Collection = mongoose.model(
	"Collection",
	collectionSchema,
	"collections",
);

/**
 * Create a new collection document.
 * `collectionData` should include: { title, user, posts: [] }.
 */
exports.createCollection = async (collectionData) => {
	const collection = new Collection(collectionData);
	return await collection.save();
};

/**
 * Get all collections belonging to the given user.
 */
exports.retrieveAll = async (userId) => {
	return await Collection.find({ user: userId }).populate({ path: 'posts', populate: { path: 'authorId', select: 'name' } });
};

/**
 * Add a post (by id) into a collection.
 *
 * Note: we push a "snapshot" of the post (lean object) into the embedded `posts` array.
 */
exports.addIntoCollection = async (collectionID, postID) => {
	const selectedCollection = await Collection.findById(collectionID);
	if (!selectedCollection) {
		throw new Error("Collection not found");
	}

	const selectedPost = await postModel.getPostById(postID);

	if (!selectedPost) {
		throw new Error("Post not found");
	}

	return await Collection.findByIdAndUpdate(collectionID, 
		{ $addToSet: { posts: postID } }, 
        { returnDocument: 'after' }
	)
};

/**
 * Find a single collection by title + user.
 */
exports.findByTitle = async (title, userId) => {
	return await Collection.findOne({ title, user: userId }).populate({ path: 'posts', populate: { path: 'authorId', select: 'name' } });
};

/**
 * Delete all collections for a given user.
 * Used when deleting an account.
 */
exports.deleteUserCollection = async (userID) => {
	return await Collection.deleteMany({ user: userID });
};

/**
 * Rename a collection.
 */
exports.renameCollection = async (collectionId, newTitle) => {
	return await Collection.findByIdAndUpdate(collectionId, { title: newTitle });
};

/**
 * Delete a collection by id.
 */
exports.deleteCollection = async (collectionId) => {
	return await Collection.findByIdAndDelete(collectionId);
};

/**
 * Remove a post snapshot from the embedded `posts` array.
 */
exports.removePostFromCollection = async (collectionId, postId) => {
	return await Collection.findByIdAndUpdate(
		collectionId,
		{ $pull: { posts: postId }},
		{ returnDocument: 'after' }
	);
};

/**
 * Get a specific collection by its document id.
 */
exports.getCollectionById = async (id) => {
	return await Collection.findById(id).populate({ path: 'posts', populate: { path: 'authorId', select: 'name' } });
};

/**
 * Remove a post ID from every collection that contains it.
 * Called when a post is deleted.
 */
exports.removePostFromAllCollections = async (postId) => {
	return await Collection.updateMany({ posts: postId }, { $pull: { posts: postId } });
};


