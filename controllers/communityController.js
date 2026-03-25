const Community = require("../models/communityModel");
const mongoose = require("mongoose");
const Post = require("../models/postModel");
const User = require("../models/registerModel");
const timeAgo = require("../functions/timeAgo");
const session = require("express-session");

exports.communityLanding = async (req, res) => {
    const communities = await Community.getAllCommunities()
    const userID = req.session.user

    res.render("community/community", {
        communities,
        userID
    })
}

exports.renderCreateCommunity = (req, res) => {
    res.render("community/community-create", {
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
            res.render("community/community-create", {
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

            const userResult = await User.addUserToCommunityUserSide(communityResult._id.toString(), req.session.user)

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
                res.render("community/community-create", {
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
        const userID = req.session.user;

        if (!mongoose.Types.ObjectId.isValid(communityID)) {
            return res.send(`
                This community doesn't seem to exist, please check the link and try again...
                    <script>
                    setTimeout(() => {
                        window.location.href = "/community";
                    }, 3000);
                </script>
            `)
        }

        const community = await Community.findCommunityById(communityID);
        const userJoinedCommunity = await Community.findUserInCommunity(communityID, userID);
        const userIsAdmin = await Community.findAdminInCommunity(communityID, userID);
        
        if (!community) {
            return res.send(`
                This community does not seem to exist. You will be redirected back to the community page in 3 seconds...
                <script>
                    setTimeout(() => {
                        window.location.href = "/community";
                    }, 3000);
                </script>
            `)
        }

        const rawPosts = await Post.getAllPost();
        const posts = []

        rawPosts.forEach(p => {
            if (p.community && p.community.toString() === communityID) {
                p.community = community
                posts.push(p);
            }
        })

        // Sort by net score (votes) descending; tie-break by newest first.
        const sortedPosts = posts.slice().sort((a, b) => {
            const voteDiff = (b.votes ?? 0) - (a.votes ?? 0);
            if (voteDiff !== 0) return voteDiff;
            return new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0);
        });

        const postsWithVotes = sortedPosts.map((post) => {
            //just to test if i up/downvote, whether the button will remain highlighted
            const existingVote = post.voters.find((voter) => voter._id === req.session.user);

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

        res.render("community/community-view", {
            community, 
            posts: postsWithVotes, 
            timeAgo, 
            inCommunity: true,
            userJoinedCommunity,
            userIsAdmin
        });
    } catch (e) {
        console.error(e)
    }
}

exports.joinCommunity = async(req, res) => {
    try {
        const session = req.session
        const communityID = req.params.communityID;
        const addCommunity = await Community.addUserToCommunity(communityID, session.user);
        const addUser = await User.addUserToCommunityUserSide(communityID, session.user);

        if (addCommunity && addUser) {
            res.send(`
                You have successfully joined ${addCommunity.name}! You will be redirected to the ${addCommunity.name} community page in 3 seconds...
                <script>
                    setTimeout(() => {
                        window.location.href = "/community/${communityID}";
                    }, 3000);
                </script>
            `)
        } else {
            res.send("An error has occured when joining this community, please try again later.")
        }
    } catch (e) {
        console.error(e)
    }
}

exports.leaveCommunity = async(req, res) => {
    const communityID = req.params.communityID;
    const userID = req.session.user
    const community = await Community.findCommunityById(communityID);
    const userAdminCheck = await Community.findAdminInCommunity(communityID, userID);


    if (userAdminCheck) {
        return res.send(`
            You are currently an administrator of the community. Please revoke your administrative status before leaving the community. You will be redirected back to the community page in 3 seconds...
            <script>
                setTimeout(() => {
                    window.location.href = "/community/${communityID}";
                }, 3000);
            </script>
        `)
    }

    const userSideRemoval = await User.removeUserFromCommunityUserSide(communityID, userID);
    const communitySideRemoval = await Community.removeUserFromCommunity(communityID, userID);

    if (userSideRemoval && communitySideRemoval) {
        return res.send(`
            You have left <strong>${community.name}</strong>. You will be redirected back to the community page in 3 seconds...
            <script>
                setTimeout(() => {
                    window.location.href = "/community";
                }, 3000);
            </script>
        `)
    } else {
        return res.send("An error has occured when trying to remove an admin, please try again later.")
    }
}

exports.renderManageCommunity = async(req, res) => {
    const communityID = req.params.communityID;
    const userID = req.session.user;
    const community = await Community.findCommunityById(communityID)
    const user = await User.findByUserID(userID);
    const isAdmin = await Community.findAdminInCommunity(communityID, userID);

    if (!isAdmin) {
        return res.send(`
            You do not have authorization to visit this page. You will be redirected back to the community page in 3 seconds...
            <script>
                setTimeout(() => {
                    window.location.href = "/community";
                }, 3000);
            </script>
        `)
    }

    community.admins = await Promise.all(
        community.admins.map(async a => {
            return await User.findByUserID(a)
        }
    ))

    community.users = await Promise.all(
        community.users.map(async u => {
            return await User.findByUserID(u)
        })
    )

    community.posts = await Promise.all(
        community.posts.map(async p => {
            return await Post.getPostById(p)
        })
    )

    if (!community) {
        return res.send(`
            This community does not seem to exist. You will be redirected back to the community page in 3 seconds...
            <script>
                setTimeout(() => {
                    window.location.href = "/community";
                }, 3000);
            </script>
        `)
    } else {
        res.render("community/community-manage", {
            community,
            user
        })
    }
}

exports.removeAdmin = async(req, res) => {
    try {
        const communityID = req.params.communityID;
        const targetID = req.body.adminID;
        const userID = req.session.user;

        const community = await Community.findCommunityById(communityID);

        if (!community) {
            return res.send(`
                This community does not seem to exist. You will be redirected back to the community page in 3 seconds...
                <script>
                    setTimeout(() => {
                        window.location.href = "/community";
                    }, 3000);
                </script>
            `)
        }

        if (community.admins.length == 1) {
            return res.send(`
                This administrator is currently the last one within this community. To remove this administrator, you need to delete the community as a minimum of one administrator is required per community. You will be redirected back to the community page in 3 seconds...
                <script>
                    setTimeout(() => {
                        window.location.href = "/community/${communityID}/manage";
                    }, 3000);
                </script>
            `)
        }

        const resultCommunitySide = await Community.removeAdminFromCommunity(communityID, targetID);
        const resultUserSide = await User.removeUserFromCommunityUserSide(communityID, targetID);

        if (resultCommunitySide, resultUserSide) {
            if (userID === targetID) {
                return res.send(`
                    You have removed <strong>${resultUserSide.name} (yourself)</strong> as an administrator of this community. You will be redirected back to the community page in 3 seconds...
                    <script>
                        setTimeout(() => {
                            window.location.href = "/community/${communityID}";
                        }, 3000);
                    </script>
                `)
            } else {
                return res.send(`
                    You have removed the user <strong>${resultUserSide.name}</strong> as an administrator of this community. You will be redirected back to the manage page in 3 seconds...
                    <script>
                        setTimeout(() => {
                            window.location.href = "/community/${communityID}/manage";
                        }, 3000);
                    </script>
                `)
            }
        } else {
            return res.send("An error has occured when trying to remove an admin, please try again later.")
        }
    } catch (e) {
        console.error(e)
    }

}

exports.removeUser = async(req, res) => {
    try {
        const communityID = req.params.communityID;
        const targetID = req.body.userID;
        const userID = req.session.user;

        const target = await User.findByUserID(targetID);
        const community = await Community.findCommunityById(communityID);
        const targetAdmin = await Community.findAdminInCommunity(communityID, targetID);


        if (!community) {
            return res.send(`
                This community does not seem to exist. You will be redirected back to the community page in 3 seconds...
                <script>
                    setTimeout(() => {
                        window.location.href = "/community";
                    }, 3000);
                </script>
            `)
        }

        if (targetAdmin) {
            return res.send(`
                The target user for removal is currently an admin. Please revoke their administrative status before removing them from the community. You will be redirected back to the community management page in 3 seconds...
                <script>
                    setTimeout(() => {
                        window.location.href = "/community/${communityID}/manage";
                    }, 3000);
                </script>
            `)
        }

        const resultCommunitySide = await Community.removeUserFromCommunity(communityID, targetID);
        const resultUserSide = await User.removeUserFromCommunityUserSide(communityID, targetID);

        if (resultCommunitySide && resultUserSide) {
            return res.send(`
                This user <strong>${target.name}</strong> has been removed from the server. You will be redirected back to the community management page in 3 seconds...
                <script>
                    setTimeout(() => {
                        window.location.href = "/community/${communityID}/manage";
                    }, 3000);
                </script>
            `)
        } else {
            return res.send("An error has occured when trying to remove a user, please try again later.")
        }
    } catch (e) {
        console.error(e)
    }
}

exports.addAdmin = async (req, res) => {
    const communityID = req.params.communityID;
    const targetID = req.body.userID;
    const userID = req.session.user;

    const target = await User.findByUserID(targetID);
    const community = await Community.findCommunityById(communityID);

    if (!community) {
        return res.send(`
            This community does not seem to exist. You will be redirected back to the community page in 3 seconds...
            <script>
                setTimeout(() => {
                    window.location.href = "/community";
                }, 3000);
            </script>
        `)
    }

    const resultCommunitySide = await Community.addAdminToCommunity(communityID, targetID);
    const resultUserSide = await User.addUserToCommunityUserSide(communityID, targetID);

    if (resultCommunitySide && resultUserSide) {
        return res.send(`
            This user <strong>${target.name}</strong> has been made into an admin! You will be redirected back to the community management page in 3 seconds...
            <script>
                setTimeout(() => {
                    window.location.href = "/community/${communityID}/manage";
                }, 3000);
            </script>
        `)
    } else {
        return res.send("An error has occured when trying to make a user an administrator, please try again later.")
    }
}

exports.deleteCommunityRenderConfirmation = async (req, res) => {
    const communityID_params = req.params.communityID;
    const communityID = req.body.communityID;
    const userID = req.session.user;

    if (communityID_params !== communityID) {
        return res.send(`
            Invalid community deletion. You will be redirected back to the community in 3 seconds...
            <script>
                setTimeout(() => {
                    window.location.href = "/community/${communityID}"
                }, 3000);
            </script>
        `)
    }

    const userAdmin = await Community.findAdminInCommunity(communityID, userID);
    const community = await Community.findCommunityById(communityID);
    const user = await User.findByUserID(userID);

    if (!userAdmin) {
        return res.send(`
            You are not an administrator. Please ensure you have the correct credentials before initiating the deletion action. You will be redirected back to the community page in 3 seconds...
            <script>
                setTimeout(() => {
                    window.location.href = "/community/${communityID}"
                }, 3000);
            </script>
        `)
    }

    if (!community) {
        return res.send(`
            This community does not seem to exist. You will be redirected back to the community page in 3 seconds...
            <script>
                setTimeout(() => {
                    window.location.href = "/community";
                }, 3000);
            </script>
        `)
    }

    res.render("community/community-deleteConfirmation", {
        community, 
        user
    })
}

exports.deleteCommunity = async(req, res) => {
    const communityID_params = req.params.communityID;
    const communityID = req.body.communityID;
    const userID = req.session.user;
    const action = req.body.confirmedDeletion;

    if (communityID_params !== communityID) {
        return res.send(`
            Invalid community deletion. You will be redirected back to the community in 3 seconds...
            <script>
                setTimeout(() => {
                    window.location.href = "/community/${communityID}"
                }, 3000);
            </script>
        `)
    }

    const userAdmin = await Community.findAdminInCommunity(communityID, userID);
    const community = await Community.findCommunityById(communityID);

    if (!userAdmin) {
        return res.send(`
            You are not an administrator. Please ensure you have the correct credentials before initiating the deletion action. You will be redirected back to the community page in 3 seconds...
            <script>
                setTimeout(() => {
                    window.location.href = "/community/${communityID}"
                }, 3000);
            </script>
        `)
    }

    if (!community) {
        return res.send(`
            This community does not seem to exist. You will be redirected back to the community page in 3 seconds...
            <script>
                setTimeout(() => {
                    window.location.href = "/community";
                }, 3000);
            </script>
        `)
    }

    if (action === "CONFIRM deletion") {
        const userRemoval = community.users
        const usersideRemoval = await Promise.all(
            userRemoval.map(async u => {
                try {
                    const r = await User.removeUserFromCommunityUserSide(communityID, u)
                    console.log(r)
                    if (!r) {
                        throw new Error("A user has failed to be removed from the community. Please try again later...");
                    }
                    return r
                } catch (e) {
                    console.error(e)
                }
            })
        )

        const communitysideRemoval = await Community.deleteCommunityById(communityID);

        if (usersideRemoval && communitysideRemoval) {
            return res.send(`
                The deletion of the community <strong>${community.name}</strong> has been completed! You will be redirected back to the community in 3 seconds...
                <script>
                    setTimeout(() => {
                        window.location.href = "/community";
                    }, 3000);
                </script>
            `)
        }
    } else {
        return res.send(`
            The deletion of the community has been cancelled. You will be redirected back to the community in 3 seconds...
            <script>
                setTimeout(() => {
                    window.location.href = "/community/${community._id}";
                }, 3000);
            </script>
        `)
    }
}


exports.deletePost = async(req, res) => {
    const communityID = req.params.communityID;
    const userID = req.session.user;
    const postID = req.body.postID;

    console.log(postID)

    const community = await Community.findCommunityById(communityID);
    const post = await Post.getPostById(postID);

    if (!community) {
        return res.send(`
            This community does not seem to exist. You will be redirected back to the community page in 3 seconds...
            <script>
                setTimeout(() => {
                    window.location.href = "/community";
                }, 3000);
            </script>
        `)
    }

    if (!post) {
        return res.send(`
            This post with ID ${postID} does not seem to exist. You will be redirected back to the community page in 3 seconds...
            <script>
                setTimeout(() => {
                    window.location.href = "/community";
                }, 3000);
            </script>
        `)
    }

    const resultCommunitySide = await Community.deletePostFromCommunity(communityID, post._id);
    const resultServerSide = await Post.deletePost(post._id);

    if (resultCommunitySide && resultServerSide) {
        return res.send(`
            This post with ID ${postID} has been deleted. You will be redirected back to the community page in 3 seconds...
            <script>
                setTimeout(() => {
                    window.location.href = "/community/${communityID}";
                }, 3000);
            </script>
        `)
    } else {
        return res.send("An error has occured when trying to make a user an administrator, please try again later.")
    }
}

exports.saveChanges = async(req, res) => {
    const userID = req.session.user
    const communityID = req.body.communityID
    const community = await Community.findCommunityById(communityID);
    const communityName = req.body.comName || null
    const communityDescription = req.body.comDesc || null
    const communityExistence = await Community.findCommunityByName(communityName)
    
    const errors = []

    if (!communityName || communityName.length == 0) {
        errors.push("Community name cannot be empty")
    } else if (communityName.length > 100) {
        errors.push("Community name length cannot exceed <strong>100 characters</strong>")
    }

    if (!communityDescription || communityDescription.length == 0) {
        errors.push("Community description cannot be empty")
    } else if (communityDescription.length > 800) {
        errors.push("Community description length cannot exceed <strong>800 characters</strong>")
    }

    if (community.name == communityName && community.description == communityDescription ) {
        return res.send(`
            There are no changes to the name or description. No changes saved.
            <br>
            <a href="/community/${communityID}/manage">Go back</a>
        `)
    } else if ((communityDescription == community.description) && communityExistence) {
        errors.push(`The community name ${communityName} is already taken. Please select another one`)
    }

    let html = []
    errors.forEach(e => {
        html.push(`
            <li>${e}</li>    
        `)
    })

    if (errors.length > 0) {
        res.send(`
            The following errors have occured:
            <ul>
                ${html.join()}
            <ul>
            <br>
            <a href="/community/${communityID}/manage">Go back</a>
        `)
    } else {
        const nameChange = community.name == communityName ? "No changes" : await Community.editCommunityName(communityID, userID, communityName);
        const descChange = community.description == communityDescription ? "No changes" : await Community.editCommunityDescription(communityID, userID, communityDescription);

        console.log(nameChange, descChange)
        if ((nameChange || nameChange == "No changes") && (descChange || descChange == "No changes")) {
            return res.send(`
                The following changes have been made. 
                <ul>
                    <li>Community name changed: ${nameChange == "No changes" ? "<strong>No changes</strong>" : nameChange.name}</li>
                    <li>Community description changed: ${descChange == "No changes" ? "<strong>No changes</strong>" : descChange.description}</li>
                </ul>

                You will be redirected back to the community management page in 3 seconds...
                <script>
                    setTimeout(() => {
                        window.location.href = "/community/${communityID}/manage";
                    }, 3000);
                </script>
            `)
        } else {
            res.send("An error has occured when saving changes to community name and description")
        }
    }
}