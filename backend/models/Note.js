const mongoose=require("mongoose");
const noteSchema=new mongoose.Schema({
  title:String,
  content:String,
  tags:String,
  summary:String,
},{
  timestamps:true
});
module.exports=mongoose.model("Note",noteSchema);