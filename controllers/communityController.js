const Community = require("../models/communityModel");
const mongoose = require("mongoose");
const Post = require("../models/postModel");
const User = require("../models/registerModel");
const timeAgo = require("../functions/timeAgo");

exports.communityLanding = async (req, res) => {
    const session = req.session
    if (!session || !session.user) {
        return res.redirect("/login")
    }

    const communities = await Community.getAllCommunities()

    res.render("community", {
        communities
    })
}

exports.renderCreateCommunity = (req, res) => {
    res.render("community-create", {
        errors: [],
        communityName: null,
        communityDescription: null
    })
}

exports.createCommunity = async (req, res) => {
    try {
        const comName = req.body.communityName || null
        const comDesc = req.body.communityDescription || null
        const communityExistence = await Community.findCommunityByName(comName)
        const errors = []

        if (!comName || comName.length == 0) {
            errors.push("Community name cannot be empty")
        } else if (comName.length > 100) {
            errors.push("Community name length cannot exceed <strong>100 characters</strong>")
        }

        if (!comDesc || comDesc.length == 0) {
            errors.push("Community description cannot be empty")
        } else if (comDesc.length > 800) {
            errors.push("Community description length cannot exceed <strong>800 characters</strong>")
        }

        if (communityExistence) {
            errors.push(`The community name ${comName} is already taken.`)
        }

        if (errors.length > 0) {
            res.render("community-create", {
                errors,
                communityName: comName,
                communityDescription: comDesc
            })
        } else {
            const communityResult = await Community.createCommunity(
                {
                    name: comName,
                    description: comDesc,
                    users: [req.session.user],
                    admins: [req.session.user],
                    posts: []
                }
            )

            const userResult = await User.addUserToCommunityUserSide(communityResult._id, req.session.user)

            if (communityResult && userResult) {
                res.send(
                    `
                    Your community has been created. Welcome to your community, ${communityResult.name}!<br><br>
                        You will be redirected to the community page in 3 seconds...
                        <script>
                            setTimeout(() => {
                                window.location.href = "/community";
                            }, 3000);
                        </script>
                    `
                )
            } else {
                errors.push("An error has occured when creating your community. Please try again later.")
                res.render("community-create", {
                    errors,
                    communityName: comName,
                    communityDescription: comDesc
                })
            }
        }
    } catch (e) {
        console.error(e)
    }
}

exports.renderCommunity = async(req, res) => {
    try {
        const communityID = req.params.communityID;

        if (!mongoose.Types.ObjectId.isValid(communityID)) {
            return res.send("This community doesn't seem to exist, please check the link and try again...")
        }

        const community = await Community.findCommunityById(communityID);
        const posts = []

        for (let i of community.posts) {
            const p = await Post.getPostById(i)
            posts.push(p)
        }

        const reversedPosts = posts.slice().reverse()

        const postsWithVotes = reversedPosts.map((post) => {
            //just to test if i up/downvote, whether the button will remain highlighted
            const existingVote = post.voters.find((voter) => voter.username === username);

            //converting the img buffer to base64 string for ejs
            let imageBase64 = null;
            if (post.image && post.image.data) {
                imageBase64 = Buffer.from(post.image.data.buffer).toString('base64');
            }

            return {
                ...post,
                userVote: existingVote ? existingVote.voteType : null,
                imageBase64,
                imageType: post.image ? post.image.contentType : null
            };
        });

        res.render("community-view", {
            community, posts: postsWithVotes, timeAgo
        });
    } catch (e) {
        console.error(e)
    }
}