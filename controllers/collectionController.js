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
  return res.render("collection/create-collection", { msg, result: null });
};

// POST /home/new-collection
exports.addCollection = async (req, res) => {
  const title = req.body.title;

  let result = null;
  let msg = null;

  if (!req.session || !req.session.user) return res.redirect("/login");
  if (!title) return res.redirect("/home/new-collection");

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

  if (!req.session || !req.session.user) return res.redirect("/login");

  try {
    const collectionList = await collectionModel.retrieveAll(req.session.user);
    return res.render("collection/show-collection", { collectionList, msg });
  } catch (error) {
    console.error(error);
    return res.send("Error reading collection");
  }
};

// GET /home/collection/:title
exports.displayPostInCollection = async (req, res) => {
  const collectionTitle = req.params.title;

  if (!req.session || !req.session.user) return res.redirect("/login");

  try {
    const collection = await collectionModel.findByTitle(
      collectionTitle,
      req.session.user,
    );
    return res.render("collection/indivCollection", { collection });
  } catch (error) {
    console.error(error);
    return res.send("Error reading collection");
  }
};

// POST /home/rename-collection
exports.renameCollection = async (req, res) => {
  const collectionId = req.body.collectionId;
  const newTitle = req.body.newTitle;

  if (!req.session || !req.session.user) return res.redirect("/login");

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

  if (!req.session || !req.session.user) return res.redirect("/login");

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

  if (!req.session || !req.session.user) return res.redirect("/login");

  try {
    const collection = await collectionModel.findByTitle(
      collectionTitle,
      req.session.user,
    );
    await collectionModel.removePostFromCollection(collection._id, postId);
    return res.redirect(`/home/collection/${collectionTitle}`);
  } catch (error) {
    console.error(error);
    return res.redirect(`/home/collection/${collectionTitle}`);
  }
};

// GET /home/collection/:id/rename
exports.showRenameCollection = async (req, res) => {
  if (!req.session || !req.session.user) return res.redirect("/login");

  try {
    const collection = await collectionModel.getCollectionById(req.params.id);
    return res.render("collection/rename-collection", { collection });
  } catch (error) {
    console.error(error);
    return res.send("Error reading collection");
  }
};

// GET /post/:id/add-to-collection
exports.showCollectionDetails = async (req, res) => {
  const postId = req.params.id;

  if (!req.session || !req.session.user) return res.redirect("/login");

  try {
    const post = await postModel.getPostById(postId);
    const collectionList = await collectionModel.retrieveAll(req.session.user);
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

  if (!req.session || !req.session.user) return res.redirect("/login");

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

