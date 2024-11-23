require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const PORT = 6005;
const session = require("express-session");
const passport = require("passport");
const connectDB = require("./db/conn");
const userdb = require("./model/userSchema");
const GitHubStrategy = require("passport-github2").Strategy;

const clientid = process.env.CLIENT_ID;
const clientsecret = process.env.CLIENT_SECRET;

connectDB();
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

app.use(express.json());

// set up session
app.use(
  session({
    secret: "f1d23sd4a5a67aa8a",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GitHubStrategy(
    {
      clientID: clientid,
      clientSecret: clientsecret,
      callbackURL: "/auth/github/callback",
      scope: ["user:email"], // Adjusted scope for GitHub to include email
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        //  user is exist
        let user = await userdb.findOne({ googleId: profile.id });

        if (!user) {
          user = new userdb({
            // same data base store the data googleid and githubid
            googleId: profile.id, // googleid stroe the github id here
            displayName: profile.displayName,
            email: profile.emails?.[0]?.value,
            image: profile.photos?.[0]?.value,
          });

          await user.save();
        }

        // console.log("AccessToken:", accessToken);
        // console.log("Profile:", profile);
        // console.log(user);
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

app.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

app.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    successRedirect: "http://localhost:3000/dashboard/",
    failureRedirect: "http://localhost:3000/login",
  })
);

app.get("/", (req, res) => {
  res.send("test home");
});

app.get("/login/sucess", async (req, res) => {
  if (req.user) {
    res.status(200).json({ message: "user Login", user: req.user });
  } else {
    res.status(400).json({ message: "Not Authorized" });
  }
});

app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("http://localhost:3000");
  });
});
app.listen(PORT, () => {
  console.log("server is run 6005");
});
