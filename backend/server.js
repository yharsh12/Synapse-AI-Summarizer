require("dotenv").config();
const gem=require("./gemini");
const express=require("express");
const cors=require("cors");
const connectDB=require("./config/db");
const noteRoutes=require("./routes/noteRoutes");
const app=express();
connectDB();
app.use(cors());
app.use(express.json());
app.use("/api/notes",noteRoutes);
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
const PORT=process.env.PORT || 5000;
app.listen(PORT,()=>{
  console.log(`Server running on http://localhost:${PORT}`);
});