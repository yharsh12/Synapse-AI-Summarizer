const Note=require("../models/Note");
const gem=require("../gemini");
const getNotes=async(req,res)=>{
  try{
    const notes=await Note.find().sort({ createdAt: -1 });
    res.json(notes);
  }
  catch(error){
    res.status(500).json({
      message:error.message,
    });
  }
};
const createNote=async(req,res)=>{
  try{
    const note=await Note.create(req.body);
    res.status(201).json(note);
  }
  catch(error){
    res.status(500).json({
      message:error.message,
    });
  }
};
const summarizeNote=async(req,res)=>{
  try{
    const{text,noteId}=req.body;
    if(!text){
      return res.status(400).json({
        message:"Text is required",
      });
    }
    const prompt=`Summarize the following text.
    Use Markdown headings and bullet points where appropriate.
    Do not include an introductory sentence.
    Do not write "Summary" as a heading.
    Return only the summary.
    ${text}`;
    let summary=await gem(prompt);
    summary=summary
      .replace(/^#+\s*\**Summary\**:?\s*/i,"")
      .replace(/^Here is a clear and concise summary of the text:?\s*/i,"")
      .trim();
    if(noteId){
      await Note.findByIdAndUpdate(
        noteId,
        {summary},
        {new:true}
      );
    }
    res.json({summary});
  }
  catch(error){
    console.log("SUMMARY ERROR:",error);
    res.status(500).json({
      message:error.message,
    });
  }
};
const updateNote=async(req,res)=>{
  try{
    const updatedNote=await Note.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );
    if(!updatedNote){
      return res.status(404).json({
        message:"Note not found",
      });
    }
    res.json(updatedNote);
  }
  catch(error){
    res.status(500).json({
      message:error.message,
    });
  }
};
const deleteNote=async(req,res)=>{
  try{
    const deletedNote=await Note.findByIdAndDelete(
      req.params.id
    );
    if(!deletedNote){
      return res.status(404).json({
        message:"Note not found",
      });
    }
    res.json({
      message:"Note deleted successfully",
    });
  }
  catch(error){
    res.status(500).json({
      message:error.message,
    });
  }
};
module.exports={getNotes,createNote,updateNote,deleteNote,summarizeNote,};