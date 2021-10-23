//jshint esversion:6

///////////// REQUIRE SECTION ///////////////////////////
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRound = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const InstagramStrategy = require('passport-instagram').Strategy;
///////////// REQUIRE SECTION //////////////////////////

//////////// APP USE SECTION ///////////////////////////
const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: "Our Little Secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


//////////// APP USE SECTION ///////////////////////////

//////////// MONGOOSE(MONGODB) ////////////////////////

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    googleId: String,
    instagramId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser((user, done)=> {
    done(null, user.id);
  });
  
  passport.deserializeUser((id, done)=> {
    User.findById(id, (err, user)=> {
      done(err, user);
    });
  });

///////////// GOOGLE OAUTH 2.0 /////////////////////////
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

///////////// GOOGLE OAUTH 2.0 /////////////////////////

///////////// INSTAGRAM OAUTH 2.0 /////////////////////////
passport.use(new InstagramStrategy({
    clientID: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/instagram/secrets"
  },
  function(accessToken, refreshToken, profile, done) {
      console.log(profile);
    User.findOrCreate({ instagramId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

///////////// INSTAGRAM OAUTH 2.0 /////////////////////////


//////////// MONGOOSE(MONGODB) ////////////////////////


//////////// GET METHOD ///////////////////////////////

app.get("/", (req,res)=>{
    res.render("home");
});

app.get("/auth/google", 
    passport.authenticate("google", {scope: ["profile"] })
);

app.get("/auth/google/secrets",
    passport.authenticate("google", {failureRedirect: "/login"}),
    (req,res)=>{
        //Successfull authentication, redirect to secret route
        res.redirect("/secrets");
    }
)

app.get("/auth/instagram",
    passport.authenticate("instagram")
);

app.get("/auth/instagram/secrets",
    passport.authenticate("instagram", {failureRedirect: "/login"}),
    (req,res)=>{
        //Succesfull authentication, redirect to secret route
        res.redirect("/secrets");
    }
);

app.get("/login", (req,res)=>{
    res.render("login");
});

app.get("/logout", (req,res)=>{
    req.logout();
    console.log("success logout");
    res.redirect("/");
})

app.get("/register", (req,res)=>{
    res.render("register");
});

app.get("/secrets", (req,res)=>{
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});

/////////// GET METHOD ////////////////////////////////

/////////// POST METHOD ///////////////////////////////

app.post("/register", (req,res)=>{
    ///////////////////// using hash bcrypt along with salt ///////////
    // bcrypt.hash(req.body.password, saltRound, (err,hash)=>{
    //     const newUser = new User ({
    //         email: req.body.username,
    //         password: hash
    //     });
    
    //     newUser.save((err)=>{
    //         if(!err){
    //             console.log("Success to add new user to database");
    //             res.render("secrets");
    //         }else{
    //             console.log(err);
    //         }
    //     });
    // }); 
    ///////////////////// using hash bcrypt along with salt ///////////  
    
    ///////////////////// using passport local mongoose ///////////////////////  
    User.register({username: req.body.username}, req.body.password, (err, user)=>{
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,()=>{
                console.log("success");
                res.redirect("/secrets");
            });
        }
    });

});

app.post("/login", (req,res)=>{
    ///////////////////// using hash bcrypt along with salt /////////// 
    // const username = req.body.username;
    // const password = req.body.password;

    // User.findOne({email: username}, (err, foundUser)=>{
    //     if(!err){
    //         if(foundUser){
    //            bcrypt.compare(password, foundUser.password, (err, result)=>{
    //                if(result === true){
    //                    res.render("secrets");
    //                }else{
    //                    console.log("wrong password");
    //                }
    //            });
    //         }else{
    //             console.log("Wrong Username");
    //         }
    //     }else{
    //         console.log(err);
    //     }
    // });
    ///////////////////// using hash bcrypt along with salt ///////////
    
    ///////////////////// using passport local mongoose /////////////////////// 
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err)=>{
        if(err){
            console.log(err);
            res.redirect("/login");
        }else{
            passport.authenticate("local")(req, res, ()=>{
                console.log("success login");
                res.redirect("secrets");
            });
        }
    });

});

/////////// POST METHOD ///////////////////////////////


app.listen(3000, ()=>{
    console.log("server listening on port 3000");
});