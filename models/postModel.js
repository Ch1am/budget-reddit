const mongoose = require("mongoose");

const voterSchema = new mongoose.Schema({
	username: String,
	voteType: String
});

const postSchema = new mongoose.Schema({
	author:       { type: String, required: true ,default: "guest"},
	title:        { type: String, required: true },
	snippet:      { type: String, required: true },
	image: {       data: { type: Buffer, default: null }, contentType:{type:String,default:null}},
	community:    { type: mongoose.Schema.Types.ObjectId, ref: "Community", default: null },
	votes:        { type: Number, default: 0 },
	voters:       [voterSchema],
	commentCount: { type: Number, default: 0 },
	createdAt: { type: Date },
});

const collectionSchema = new mongoose.Schema({
    title: {type: String, required: true},
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    posts: [postSchema]
})

const Collection = mongoose.model('Collection', collectionSchema,'collections')

const Post = mongoose.model('Post', postSchema, 'posts');


//Function getAllPost retrieves all data
const getAllPost = async () => {
	return await Post.find().lean();
};

//Function to get sigle post by id
const getPostById = async (id) => {
	return await Post.findById(id).lean();
};

//function getPostsByAuthor retrieves all posts made by user who is logged in.
const getPostsByAuthor = async (author) => {
	return await Post.find({ author }).lean();
};

//Function createPost to create a new post and insert into mongo
const createPost = async (postData) => {
	const post = new Post(postData);
	return await post.save();
};

//Function creates a new collection
const createCollection = async (collectionData) => {
	const collection = new Collection (collectionData)
	return await collection.save()
}

// Retrives all collection
const retrieveAll = async (userId) =>{
	return Collection.find({user: userId})
}

// Adds a post into collection
const addIntoCollection = async (collectionID, postID) => {
	let selectedCollection = await Collection.findById(collectionID)
	let selectedPost = await Post.findById(postID).lean()
	// let isAlreadyAdded = false
	// for (let i = 0; i < selectedCollection.posts.length; i++) {
	//   if (selectedCollection.posts[i]._id.toString()===postID.toString()) {
	//     isAlreadyAdded = true
	//   }
	// } 
	// if (!isAlreadyAdded) {
	// GREEN PARTS not needed coz validated in the post-view itself
	selectedCollection.posts.push(selectedPost)
	return await selectedCollection.save()
	// }
	// console.log("Post already in collection!")
	// return null
}

// Find a specific collection by its title
const findByTitle = async (title, userId) =>{
    return await Collection.findOne({title: title, user: userId}).lean();
}

const deleteUserCollection = (userID) => {
	return Collection.deleteMany({ user: userID });
}

// Get all posts in a collection
const renameCollection = async (collectionId, newTitle) =>{
	return Collection.findByIdAndUpdate(collectionId, {title: newTitle})
}

const deleteCollection = async(collectionId)=>{
	return Collection.findByIdAndDelete(collectionId)
}

const removePostFromCollection = async (collectionId, postId)=>{
	return Collection.findByIdAndUpdate(collectionId, 
		{$pull: {posts: { _id: new mongoose.Types.ObjectId(postId) }}
	})
}
const getCollectionById = async (id)=>{
	return Collection.findById(id).lean()
}

// update vote count and voters list
const updateVote = async (id, username, voteType, voteChange) => {
	const post = await Post.findById(id);
	// remove existing vote if any
	post.voters = post.voters.filter((v) => v.username !== username);
	// add new vote if not removing
	if (voteType !== null) {
		post.voters.push({ username, voteType });
	}
	// update vote count
	post.votes += voteChange;

	// save back to MongoDB
	await post.save();
};

//editing logged in user post
const updatePost = async (id, updatedData) => {
	return await Post.findByIdAndUpdate(id, updatedData);
};

//deleting logged in user post
const deletePost = async (id) => {
	return await Post.findByIdAndDelete(id);
};

module.exports = {
	getAllPost,
	getPostById,
	getPostsByAuthor,
	createPost,
	updateVote,
	updatePost,
	deletePost,
	retrieveAll, 
	createCollection,
	addIntoCollection,
	findByTitle,
	removePostFromCollection, 
	deleteCollection, 
	renameCollection, 
	getCollectionById,
	deleteUserCollection
};
