//jshint esversion:6

///////////// REQUIRE SECTION ///////////////////////////
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
///////////// REQUIRE SECTION //////////////////////////

//////////// APP USE SECTION ///////////////////////////
const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
//////////// APP USE SECTION ///////////////////////////

//////////// MONGOOSE(MONGODB) ////////////////////////

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});


userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});

const User = new mongoose.model("User", userSchema);

//////////// MONGOOSE(MONGODB) ////////////////////////


//////////// GET METHOD ///////////////////////////////

app.get("/", (req,res)=>{
    res.render("home");
});

app.get("/login", (req,res)=>{
    res.render("login");
});

app.get("/register", (req,res)=>{
    res.render("register");
});

/////////// GET METHOD ////////////////////////////////

/////////// POST METHOD ///////////////////////////////

app.post("/register", (req,res)=>{
    const newUser = new User ({
        email: req.body.username,
        password: req.body.password
    });

    newUser.save((err)=>{
        if(!err){
            console.log("Success to add new user to database");
            res.render("secrets");
        }else{
            console.log(err);
        }
    });
});

app.post("/login", (req,res)=>{
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username}, (err, foundUser)=>{
        if(!err){
            if(foundUser){
                if(foundUser.password === password){
                    res.render("secrets");
                }else{
                    console.log("Wrong Password");
                }
            }else{
                console.log("Wrong Username");
            }
        }else{
            console.log(err);
        }
    })
})

/////////// POST METHOD ///////////////////////////////


app.listen(3000, ()=>{
    console.log("server listening on port 3000");
});