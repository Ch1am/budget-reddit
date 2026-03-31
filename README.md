# MemeIt

**Course:** IS113 Web Application Development - AY2025/2026 Semester 2

**Group members:** 
1. Lew Jing Yuan 
2. Marcus Chiam
3. Wong Wing Yee
4. Kannarak Tansutchatchawarn
5. Russell

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Usage Guide](#usage-guide)
- [License](#license)

---

## Overview

MemeIt is a full-stack web application inspired by Reddit. It allows users to upload and share memes via image uploads or external links. Posts are ranked dynamically by community votes, with the most popular content surfacing to the top. Users can organise content into communities, bookmark posts into personal collections, and engage with others through comments.

---

## Features

| Feature | Description |
|---|---|
| **Authentication** | User registration and login with securely hashed passwords |
| **Post Management** | Create, view, edit, and delete meme posts (image upload or link) |
| **Voting** | Upvote and downvote posts; posts are ranked by net vote count |
| **Comments** | Add, edit, delete, and vote on comments on any post |
| **Communities** | Create and manage subreddit-style community spaces |
| **Collections** | Place specific posts into a personalized collection to view in the future |
| **Account Settings** | Update username, change password, or delete your account |
| **Relative Timestamps** | Posts and comments display human-readable time (e.g. "2 hours ago") |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js |
| **Framework** | Express.js v5 |
| **Templating Engine** | EJS |
| **Database** | MongoDB Atlas (cloud) via Mongoose |
| **Authentication** | express-session, bcrypt |
| **Configuration** | dotenv |
| **Development** | nodemon |

---

## Project Structure

```
budget-reddit/
│
├── server.js                   # Application entry point — Express setup and DB connection
├── config.env                  # Environment variables (not committed to version control)
├── package.json
│
├── routes/                     # Route definitions
│   ├── authentication.js       # Login and registration routes
│   ├── home.js                 # Home feed
│   ├── posts.js                # Post CRUD routes
│   ├── comment.js              # Comment CRUD routes
│   ├── community.js            # Community management routes
│   ├── collection.js           # Collection routes
│   └── settings.js             # Account settings routes
│
├── controllers/                # Logic handlers
│   ├── homeController.js
│   ├── postController.js
│   ├── commentController.js
│   ├── communityController.js
│   ├── collectionController.js
│   ├── settingsController.js
│   └── passwordController.js
│
├── models/                     # Mongoose schemas and data models
│   ├── registerModel.js        # User schema
│   ├── postModel.js            # Post schema
│   ├── commentModel.js         # Comment schema
│   ├── communityModel.js       # Community schema
│   └── collectionModel.js      # Collection schema
│
├── middleware/
│   └── auth.js                 # Session-based authentication
│
├── functions/
│   └── timeAgo.js              # Utility: converts timestamps to relative time strings
│
├── views/                      # EJS templates
│   ├── landing.ejs
│   ├── auth/                   # login.ejs, register.ejs
│   ├── post/                   # post-create, post-edit, post-view, myPost
│   ├── community/              # community, community-view, community-create, community-manage, etc.
│   ├── collection/             # show-collection, create-collection, rename-collection, etc.
│   ├── settings/               # settings.ejs
│   └── partials/               # Reusable components: nav, footer, post card, comment
│
└── public/                     # Statically served assets
    ├── css/                    # Per-page stylesheets
    ├── icons/                  # SVG icons (vote arrows, comment, settings, etc.)
    └── uploads/                # User-uploaded image files
```

---

## Prerequisites

Ensure the following are installed before proceeding:

- [Node.js](https://nodejs.org/) v18 or higher
- npm (bundled with Node.js)
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account with an active cluster

---

## Installation & Setup

**1. Clone the repository**

```bash
git clone https://github.com/Ch1am/budget-reddit.git
cd budget-reddit
```

**2. Switch to the main/development branch**

```bash
git checkout main/develop
```


**3. Install dependencies**

```bash
npm install
```

**4. Configure environment variables**

Create a file named `config.env` in the root of the project and add the following:

```
DB=your_mongodb_atlas_connection_string
SECRET=your_session_secret_key
```

> **Note:** The `config.env` file must never be committed to version control. Ensure it is listed in `.gitignore`.

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DB` | MongoDB Atlas connection URI | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `SECRET` | Secret key used to sign session cookies | `someRandomSecretString123` |

**How to obtain these values:**

- **`DB`** — From your MongoDB Atlas dashboard, navigate to **Connect > Drivers** and copy the provided connection string. Replace `<password>` with your database user's password.
- **`SECRET`** — Any long, random string of your choosing. This is used internally to secure session data and is never exposed to users.

---

## Running the Application

**Development mode** (auto-restarts on file changes via nodemon)

```bash
npm run dev
```

**Production mode**

```bash
npm start
```

Once the server is running, open a browser and navigate to:

```
http://127.0.0.1:8000
```

---

## Usage Guide

### Registration and Login

Navigate to the landing page and click **Sign Up** to create a new account. Once registered, log in with your credentials to access all features.

![Login page](./readme-images/login.png)

---

### Creating a Post

1. From the home feed, click **+ Post Meme**
2. Enter a title and either upload an image file or paste an external image link << might need changing.
3. Optionally assign the post to a Community.
4. Add a description to talk in depth on what your post is about.
5. Submit and the post will appear in the feed and be open for voting.

![Create post page](./readme-images/createPost.png)

---

### Voting

Each post displays upvote (▲) and downvote (▼) controls. Clicking either adjusts the post's score. Posts with higher net votes rank higher in the feed.

### Comments

Open any post to access the comment section. Users can add new comments and edit their own existing comments.

![Example post page](./readme-images/examplePost.png)

---

### Communities

Communities function similarly to subreddits. Users can browse existing communities from the navigation bar, or create a new one. Community creators can manage membership settings and delete their community if needed.

---

### Collections

Any post can be bookmarked by saving it to a collection. Navigate to **Collections** from the navigation bar to view all saved posts, create new collections, or rename and delete existing ones.

![Collections page](./readme-images/collection.png)

---


### Settings

Access **Settings** from the navigation bar by **clicking** the gear to update account information or change your password.

![Settings page](./readme-images/settings.png)

---

## License

This project is licensed under the **ISC License**.
See [https://opensource.org/licenses/ISC](https://opensource.org/licenses/ISC) for details.
