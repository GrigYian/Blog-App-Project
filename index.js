import express from "express";
import bodyParser from "body-parser";
import name from "ejs";
import multer from 'multer';

const app = express();
const port = 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');


app.use(express.static("public"));
// app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Array to store posts in memory
const postsArray = [];



// Mutler set up
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/'); // Store files in the 'uploads' directory
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname); // Use a unique filename
    },
  });
  
const upload = multer({ storage: storage });

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      res.status(500).send('Multer error: ' + err.message);
    } else if (err) {
      // An unknown error occurred.
      res.status(500).send('Error: ' + err.message);
    } else {
      // No error occurred, proceed to the next middleware.
      next();
    }
  });

app.get("/", (req, res) => {    
    res.render("index.ejs");   
});

app.get("/submit-post", (req, res) => {
    res.render("submit-post.ejs");
});

app.get("/posts", (req, res) => {
    const postsArraySize = postsArray.length;
    res.render("posts.ejs", { numOfPosts: postsArraySize, postsArray });
    console.log(postsArraySize);
});

// Handle POST request for submitting a post
app.post("/submit-post", upload.single("file"), (req, res) => {
    const postTitle = req.body["title"].trim();
    const postAuthor = req.body["author"].trim();
    const postText = req.body["post-text"];
    const postImage = req.file;
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    // Store the post in the array
    const newPost = { id: id, title: postTitle, author: postAuthor, text: postText, image: postImage };
    postsArray.push(newPost);

    console.log("Posts Array:", postsArray); // Log the posts array

    // Redirect to the submited post page
    res.redirect("/posted");
});

app.get("/posted", (req, res) => {
    res.render("posted.ejs", { postsArray });
});

app.get("/:title", (req, res) => {
  const requestedTitle = req.params.title.toLowerCase();
  const requestedPost = postsArray.find(post => 
      post.title.toLowerCase().replace(/\s+/g, '-') === requestedTitle
  );

  console.log("Requested Post:", requestedPost);
  if (requestedPost) {
      res.render("view-post.ejs", { post: requestedPost });
  } else {
      res.status(404).send("Post not found");
  }  
});

// Edit Post Route
app.get("/edit-post/:postId", (req, res) => {
  const postId = req.params.postId;
  // Find the post by postId from your data storage
  const post = postsArray.find(post => post.id === postId);
  if (!post) {
      return res.status(404).send("Post not found");    
  }
  res.render("edit-post.ejs", { post });
});


app.post("/edit-post/:postId", (req, res) => {
  const postId = req.params.postId;

  const postIndex = postsArray.findIndex(post => post.id === postId);
  if (postIndex === -1) {
      return res.status(404).send("Post not found");
  }

  const existingPost = postsArray[postIndex];
  postsArray[postIndex] = {
      ...existingPost,
      title: req.body.title,
      author: req.body.author,
      text: req.body["post-text"]
  };

  res.redirect("/posts");
});

// Delete Post Route
app.delete("/delete-post/:postId", (req, res) => {
  const postId = req.params.postId;
  // Find the index of the post by postId from data storage
  const postIndex = postsArray.findIndex(post => post.id === postId);
  if (postIndex === -1) {
    return res.status(404).send("Post not found");
  }
  // Remove the post from the postsArray
  postsArray.splice(postIndex, 1);
  res.status(200).json({ message: "Deleted", redirect: "/posts" });
  
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

