const express=require("express");
const router=express.Router();
const{getNotes,createNote,updateNote,deleteNote,summarizeNote,}=require("../controllers/noteController");
router.get("/",getNotes);
router.post("/",createNote);
router.put("/:id",updateNote);
router.delete("/:id",deleteNote);
router.post("/summarize",summarizeNote);
module.exports=router;