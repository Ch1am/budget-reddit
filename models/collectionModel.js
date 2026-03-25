const mongoose = require("mongoose");
const postModel = require("./postModel");

/**
 * Collection model stores a user's saved group of posts.
 *
 * Important:
 * - The `posts` array is embedded (snapshot of post fields at the time it was added).
 * - Voting for posts lives on the Post model; this embedded copy is just for display.
 */

const voterSchema = new mongoose.Schema(
  {
    username: String,
    voteType: String,
  },
  { _id: false },
);

// Embedded post snapshot used inside a Collection document
const postSchema = new mongoose.Schema(
  {
    author: { type: String, required: true, default: "guest" },
    title: { type: String, required: true },
    snippet: { type: String, required: true },
    image: {
      data: { type: Buffer, default: null },
      contentType: { type: String, default: null },
    },
    community: { type: mongoose.Schema.Types.ObjectId, ref: "Community", default: null },
    votes: { type: Number, default: 0 },
    voters: [voterSchema],
    commentCount: { type: Number, default: 0 },
    createdAt: { type: Date },
  },
  { _id: true },
);

const collectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  posts: [postSchema],
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
  return await Collection.find({ user: userId });
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

  selectedCollection.posts.push(selectedPost);
  return await selectedCollection.save();
};

/**
 * Find a single collection by title + user.
 */
exports.findByTitle = async (title, userId) => {
  return await Collection.findOne({ title, user: userId });
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
    {
      $pull: {
        posts: { _id: new mongoose.Types.ObjectId(postId) },
      },
    },
  );
};

/**
 * Get a specific collection by its document id.
 */
exports.getCollectionById = async (id) => {
  return await Collection.findById(id);
};

