//jshint esversion:6

///////////// REQUIRE SECTION ///////////////////////////
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const md5 = require("md5");
const bcrypt = require("bcrypt");
const saltRound = 10;
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


// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});


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
    bcrypt.hash(req.body.password, saltRound, (err,hash)=>{
        const newUser = new User ({
            email: req.body.username,
            password: hash
        });
    
        newUser.save((err)=>{
            if(!err){
                console.log("Success to add new user to database");
                res.render("secrets");
            }else{
                console.log(err);
            }
        });
    })    
});

app.post("/login", (req,res)=>{
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username}, (err, foundUser)=>{
        if(!err){
            if(foundUser){
               bcrypt.compare(password, foundUser.password, (err, result)=>{
                   if(result === true){
                       res.render("secrets");
                   }else{
                       console.log("wrong password");
                   }
               });
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