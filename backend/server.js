require("dotenv").config();
const gem=require("./gemini");
const express=require("express");
const cors=require("cors");
const connectDB=require("./config/db");
const cookieParser=require("cookie-parser");
const noteRoutes=require("./routes/noteRoutes");
const authRoutes=require("./routes/auth");
const app=express();
connectDB();
app.use(cors({
  origin:process.env.FRONTEND_URL,
  credentials:true
}));
app.use(express.json());
app.use(cookieParser());
app.use((req,res,next)=>{
  console.log(req.method,req.url);
  next();
});
app.use("/api/notes",noteRoutes);
app.use("/api/auth",authRoutes);
app.get("/",(req,res)=>{
  console.log("ROOT ROUTE HIT");
  res.send("HELLO FROM EXPRESS");
});
app.get("/test-gemini",async(req,res)=>{
  try{
    const result=await gem("Explain JavaScript in one sentence.");
    res.json({result});
  }
  catch(error){
    console.log(error);
    res.status(500).json({error:"Gemini failed"});
  }
});
const PORT=process.env.PORT||5000;
app.listen(PORT,()=>{
  console.log(`Server running on http://localhost:${PORT}`);
});
