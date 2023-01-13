const express = require("express");
var randomNumber = require('random-number');
const mongoose = require('mongoose');
const nodemailer = require("nodemailer");
var sid = PROCESS.ENV.SID;
var token = PROCESS.ENV.TOKEN;
var twilio = require("twilio")(sid,token);

const app = express();
app.use(express.json());

const DB = PROCESS.ENV.DB;
mongoose.set("strictQuery", false);

mongoose.connect(DB,{useNewUrlParser: true}).then(() => {
  console.log("connection successful");
}).catch((err) => console.log(err));


const userSchema = {
  phoneNumber:Number,
  otp:Number
};

const emailSchema = {
  email:String,
  otp:Number
};

const User = mongoose.model("User", userSchema);
const EmailOtp = mongoose.model("EmailOtp", emailSchema);


app.post('/login',async (req,res) => {
  try{
    var options = {
      min:  1234
    , max:  9999
    , integer: true
    }
    const num = randomNumber(options);
    const {phoneNumber} = req.body;

    const user = new User({
      phoneNumber:phoneNumber,
      otp:num
    });
  
    user.save(function(err){
      if (!err){
        res.json("OTP SENT SUCCESSFULLY");
      }
    });

    twilio.messages
    .create({
        from:PROCESS.ENV.NUMBER,
        to:"+91"+phoneNumber,
        body:"YOUR OTP IS " + num
    })
     .then((res) => {
        console.log("success");
     }).catch((err) => {
        console.log(err);
     })
    

  }catch(err){
    console.log(err);
  }
  
  

});

app.post("/verify", async (req, res) => {
  try{

    const {phoneNumber,otp} = req.body;

    if(!phoneNumber || !otp){
      return res.status(400).json({error:"Pls enter required details"});
  }

  const validUser = await User.findOne({phoneNumber:phoneNumber});

  if(!validUser){
    res.json({error:"wrong phone Number entered"});
  }else{
      if(validUser.otp == otp){
        res.json("Sign Up successfull");
      }else{
        res.json("wrong OTP Entered");
      }
  }

  }catch(err){
    console.log(err);
  }
});

app.post('/email', async (req,res) =>{
  try{
      const {email} = req.body;
      var options = {
        min:  1234
      , max:  9999
      , integer: true
      }
      const num = randomNumber(options);

      const emailOtp = new EmailOtp({
        email:email,
        otp:num
      });

      emailOtp.save();

      let transporter = nodemailer.createTransport({
        service:'gmail',
        port:465,
      host:'smtp.gmail.com',
        auth: {
          user: PROCESS.ENV.EMAIL,
          pass: PROCESS.ENV.PASSWORD,
        },
      });

      let mailOptions = {
        from: '"FED 👻" <FED@example.com>', // sender address
        to: email, // list of receivers
        subject: "VERIFICATION CODE", // Subject line
        html: "<b>Dear User</b><p>Your OTP CODE is </p> " + num, // html body
      };

      await transporter.sendMail(mailOptions,function(err,info){
        if(err){
          console.log(err);
        }else{
          res.json("OTP SENT SUCCESSFULLY");
          console.log("sent" + info.response);
        }
      });
        

  }catch(err){
    res.json("NOT SENT");
    console.log(err);
  }

});

app.post("/emailverify", async (req, res) => {
  try{

    const {email,otp} = req.body;

    if(!email || !otp){
      return res.status(400).json({error:"Pls enter required details"});
  }

  const validUser = await EmailOtp.findOne({email:email});

  if(!validUser){
    res.json({error:"wrong Email Address entered"});
  }else{
      if(validUser.otp == otp){
        res.json("Sign Up successfull");
      }else{
        res.json("wrong OTP Entered");
      }
  }

  }catch(err){
    console.log(err);
  }
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
