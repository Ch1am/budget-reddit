const express = require("express");
const router = express.Router();
const timeAgo = require("../functions/timeAgo")
const posts = [
    {
        id: 1,
        title: "How I saved $10,000 in 6 months on a minimum wage",
        snippet: "I started tracking every single expense using a spreadsheet and cut down on subscriptions. Here is what worked for me and what did not...",
        author: "john_doe",
        votes: 242,
        commentCount: 134,
        createdAt: "2025-03-06T08:00:00Z",
        image: null
    },
    {
        id: 2,
        title: "Best free budgeting apps of 2025 - a complete breakdown",
        snippet: "I tried 12 different budgeting apps over the past year. Here is my honest ranking and why I finally settled on one over the rest...",
        author: "savingsqueen",
        votes: 185,
        commentCount: 97,
        createdAt: "2025-03-06T05:00:00Z",
        image: null
    },
    {
        id: 3,
        title: "Is the 50/30/20 budgeting rule still relevant in todays economy?",
        snippet: "With rent and groceries skyrocketing, I argue the old 50/30/20 rule is outdated. Here is what I think works better now...",
        author: "frugalfrank",
        votes: 98,
        commentCount: 62,
        createdAt: "2025-03-06T09:30:00Z",
        image: "/uploads/meme1.jpg"
    },
    {
        id: 4,
        title: "I paid off $35,000 of debt in 2 years — here is my full breakdown",
        snippet: "People kept asking me how I did it so I decided to write it all out. Spoiler: it was not fun but it was absolutely worth it...",
        author: "debtfree_dave",
        votes: 310,
        commentCount: 201,
        createdAt: "2025-03-05T14:00:00Z",
        image: "/uploads/meme2.webp"
    },
    {
        id: 5,
        title: "Emergency fund — how much is actually enough?",
        snippet: "Everyone says 3 to 6 months of expenses but nobody talks about what counts as an expense. Here is how I calculated mine...",
        author: "penny_wise",
        votes: 76,
        commentCount: 45,
        createdAt: "2025-03-06T07:15:00Z",
        image: null
    },
    {
        id: 6,
        title: "Grocery budget hacks that actually work for a family of 4",
        snippet: "We cut our grocery bill from $900 to $480 a month without eating badly. Meal prepping was only part of the solution...",
        author: "thrifty_mom",
        votes: 159,
        commentCount: 88,
        createdAt: "2025-03-06T06:00:00Z",
        image: "/uploads/meme1.jpg"
    },
    {
        id: 7,
        title: "Stop treating your savings account like a reward — treat it like a bill",
        snippet: "The mindset shift that changed everything for me. Once I automated my savings on payday, I stopped missing the money entirely...",
        author: "mindful_money",
        votes: 204,
        commentCount: 119,
        createdAt: "2025-03-05T20:00:00Z",
        image: null
    },
    {
        id: 8,
        title: "Anyone else feel guilty spending money even when you can afford it?",
        snippet: "I have been frugal for so long that I feel anxious buying anything non-essential even though I am now financially stable. Is this normal?",
        author: "anxious_saver",
        votes: 431,
        commentCount: 276,
        createdAt: "2025-03-05T10:00:00Z",
        image: "/uploads/meme1.jpg"
    }
];



router.get("/", (req, res) => {
    let data = req.query.query
    data = data ? data : undefined

    res.render("landing", {
        posts, 
        query: data,
        timeAgo
    })
})

module.exports = router;