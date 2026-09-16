// ---------------- SETUP ----------------
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 4000;

// Allow Live Server (127.0.0.1:5500 or localhost:5500)
app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500"
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// ---------------- EMAIL SETUP ----------------
const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "quietlifencat@gmail.com",
    pass: ""
  }
});

// Prevent server crash if Gmail login fails
mailer.verify((err, success) => {
  if (err) {
    console.log("⚠️ Mailer error:", err.message);
  } else {
    console.log("📨 Mailer ready");
  }
});

// Store verification codes
const codes = {};

function generateCODE() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ---------------- EMAIL ROUTES ----------------
app.post("/signup", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  const code = generateCODE();
  codes[email] = code;

  try {
    await mailer.sendMail({
      from: "quietlifencat@gmail.com",
      to: email,
      subject: "Verification Code",
      text: `Your code is: ${code}`
    });

    res.json({ message: "Verification code sent!" });
  } catch (error) {
    console.log("Email error:", error.message);
    res.status(500).json({ message: "Error sending email" });
  }
});

app.post("/verify", (req, res) => {
  const { email, code } = req.body;

  if (codes[email] === code) {
    return res.json({ message: "Verified successfully!" });
  }

  res.status(400).json({ message: "Invalid code" });
});

// ---------------- USER DATA ----------------
const users = [
  {
  username: "Cai",
  birthday: "2005-04-09",
  location: "NC",
  age: 21,
  traits: ["Athletic", "Funny"],
  interests: ["Art", "Religion", "Mythology", "History", "Philosophy", "Sports", "Technology"],
  hobbies: ["Gym", "Video games", "Working out", "Hiking", "Watching anime", "Cooking", "Photography"]
}
,
  {
  username: "John",
  birthday: "2005-03-08",
  location: "AL",
  age: 21,
  traits: ["Creative", "Funny"],
  interests: ["Art", "Music", "Design", "Pop-culture", "Psychology", "Fashion", "Internet culture"],
  hobbies: ["Gym", "Reading", "Drawing", "Painting", "Journaling", "Thrifting", "Board games"]
}
,
  {
    username: "Sarah",
    birthday: "2006-04-05",
    location: "NY",
    age: 22,
    traits: ["Eager", "Emotional", "Perfectionist"],
    interests: ["True Crime", "Nails", "Religion"],
    hobbies: ["Reading", "Cooking", "Hair"]
  },
  {
    username:"Tyra",
    birthday: "2005-08-14",
    location: "NC",
    age: 20,
    traits: ["Creative", "Funny", "Caring"],
    interests: ["Internet culture", "Food", "Health & wellness"],
    hobbies: ["Reading", "TV Shows", "Shopping", "DIY projects"]
  }
];

// Auto-calc age
function calculateAge(birthday) {
  const birth = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();

  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// ---------------- SAVE USER TRAITS ----------------
app.post("/traits", (req, res) => {
  const { username, birthday, traits, interests, hobbies } = req.body;

  const index = users.findIndex(u => u.username === username);

  const newUser = {
    username,
    birthday,
    location: "Unknown",
    age: calculateAge(birthday),
    traits,
    interests,
    hobbies
  };

  if (index !== -1) {
    users[index] = newUser;
  } else {
    users.push(newUser);
  }

  res.json({ message: "User saved!" });
});

// ---------------- MATCHING ----------------
function getMatchScore(user, currentUser) {
  let score = 0;

  score += user.traits.filter(t => currentUser.traits.includes(t)).length;
  score += user.interests.filter(i => currentUser.interests.includes(i)).length;
  score += user.hobbies.filter(h => currentUser.hobbies.includes(h)).length;
  return score;
}
function  getMatches(user, currentUser){
  let tmatch = [];
  let imatch = [];
  let hmatch = [];
  tmatch.append(user.traits.filter(t => currentUser.traits.includes(t)));
  imatch.append(user.interests.filter(i => currentUser.interests.includes(i)));
  hmatch.append(user.hobbies.filter(h => currentUser.hobbies.includes(h)));
  return tmatch,imatch,hmatch;
}

app.get("/matches/:username", (req, res) => {
  const username = req.params.username;

  const currentUser = users.find(u => u.username === username);

  if (!currentUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const matches = users
    .filter(user => user.username !== username)
    .map(user => ({
      ...user,
      score: getMatchScore(user, currentUser),
      imatch: getMatches(user,currentUser)[0],
      tmatch: getMatches(user,currentUser)[1],
      hmatch: getMatches(user,currentUser)[2]
    }))
    .filter(user => user.score >= 1)
    .sort((a, b) => b.score - a.score);

  res.json(matches);
});

// ---------------- ROOT ----------------
app.get("/", (req, res) => {
  res.send("Server WORKING");
});

// ---------------- START SERVER ----------------
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
