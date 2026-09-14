const express=require("express");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const User=require("../models/User");
const router=express.Router();
function createToken(user){
  return jwt.sign(
    {
      id:user._id
    },
    process.env.JWT_SECRET,
    {
      expiresIn:"7d"
    }
  );
}
function sendUser(user){
  return {
    id:user._id,
    name:user.name,
    email:user.email,
    role:user.role,
    initials:user.initials
  };
}
router.post("/register",async(req,res)=>{
  try{
    const {name,email,password}=req.body;
    if(!name||!email||!password){
      return res.status(400).json({error:"All fields are required"});
    }
    if(password.length<6){
      return res.status(400).json({error:"Password must contain at least 6 characters"});
    }
    const cleanName=name.trim();
    const cleanEmail=email.trim().toLowerCase();
    const existingUser=await User.findOne({email:cleanEmail});
    if(existingUser){
      return res.status(409).json({error:"An account with this email already exists"});
    }
    const hashedPassword=await bcrypt.hash(password,10);
    const initials=cleanName.split(/\s+/).slice(0,2).map(part=>part[0].toUpperCase()).join("");
    const user=await User.create({
      name:cleanName,
      email:cleanEmail,
      password:hashedPassword,
      role:"Synapse User",
      initials
    });
    const token=createToken(user);
    res.cookie("synapseToken",token,{
      httpOnly:true,
      secure:process.env.NODE_ENV==="production",
      sameSite:process.env.NODE_ENV==="production" ? "none" : "lax",
      maxAge:7*24*60*60*1000
    });
    res.status(201).json({
      message:"Account created successfully",
      user:sendUser(user)
    });
  }
  catch(error){
    console.log(error);
    res.status(500).json({
      error:"Registration failed"
    });
  }
});
router.post("/login",async(req,res)=>{
  try{
    const {email,password}=req.body;
    if(!email||!password){
      return res.status(400).json({
        error:"Email and password are required"
      });
    }
    const cleanEmail=email.trim().toLowerCase();
    const user=await User.findOne({email:cleanEmail});
    if(!user){
      return res.status(401).json({
        error:"Invalid email or password"
      });
    }
    const passwordMatch=await bcrypt.compare(
      password,
      user.password
    );
    if(!passwordMatch){
      return res.status(401).json({error:"Invalid email or password"});
    }
    const token=createToken(user);
    res.cookie("synapseToken",token,{
      httpOnly:true,
      secure:process.env.NODE_ENV==="production",
      sameSite:process.env.NODE_ENV==="production" ? "none" : "lax",
      maxAge:7*24*60*60*1000
    });
    res.json({message:"Login successful",user:sendUser(user)});
  }
  catch(error){
    console.log(error);
    res.status(500).json({
      error:"Login failed"
    });
  }
});
router.get("/me",async(req,res)=>{
  try{
    const token=req.cookies.synapseToken;
    if(!token){
      return res.status(401).json({error:"Not authenticated"});
    }
    const decoded=jwt.verify(token,process.env.JWT_SECRET);
    const user=await User.findById(decoded.id).select("-password");
    if(!user){
      return res.status(401).json({
        error:"User not found"
      });
    }
    res.json({
      user:sendUser(user)
    });
  }
  catch(error){
    res.status(401).json({error:"Not authenticated"});
  }
});
router.post("/logout",(req,res)=>{
  res.clearCookie("synapseToken",{
    httpOnly:true,
    secure:process.env.NODE_ENV==="production",
    sameSite:process.env.NODE_ENV==="production" ? "none" : "lax"
  });
  res.json({message:"Logged out successfully"});
});
module.exports=router;
