const API_URL=import.meta.env.VITE_API_URL;
import {useState,useEffect} from "react";
import "./Synapse.css";
import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";
import ReactMarkdown from "react-markdown";
import axios from "axios";
pdfjsLib.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/build/pdf.worker.min.mjs",import.meta.url).toString();
export default function Synapse({user,onLogout}){
  const [title,setTitle]=useState("");
  const [content,setContent]=useState("");
  const [result,setResult]=useState("");
  const [notesList,setNotesList]=useState([]);
  const [searchInput,setSearchInput]=useState("");
  const [darkMode,setDarkMode]=useState(false);
  const [tags,setTags]=useState("");
  const [currentNoteId,setCurrentNoteId]=useState(null);
  const [profileOpen,setProfileOpen]=useState(false);
  const [status,setStatus]=useState("");
  useEffect(()=>{
    fetchNotes();
    const theme=JSON.parse(localStorage.getItem("synapseTheme")) || false;
    setDarkMode(theme);
  },[]);
  useEffect(()=>{
    localStorage.setItem("synapseTheme",JSON.stringify(darkMode));
    document.body.classList.toggle("dark",darkMode);
  },[darkMode]);
  const stats={
    words:content.trim()?content.trim().split(/\s+/).length:0,
    chars:content.length,
    lines:content.split("\n").length,
    read:content.trim()?Math.max(1,Math.ceil(content.trim().split(/\s+/).length/220)):0,
  };
  async function fetchNotes(){
    try{
      const res=await axios.get(`${API_URL}/api/notes`, {
        withCredentials: true
      });
      setNotesList(Array.isArray(res.data) ? res.data : []);
    }
    catch(err){
      console.log(err);
    }
  }
  async function saveNote(){
    try{
      const note={title:title.trim() || "Untitled",content,tags,};
      if(currentNoteId){
        await axios.put(`${API_URL}/api/notes/${currentNoteId}`,
          note,
          {
            withCredentials: true
          }
        );
      }
      else{
        const res=await axios.post(`${API_URL}/api/notes`,
          note,
          {
            withCredentials: true
          }
        );
        setCurrentNoteId(res.data._id);
      }
      await fetchNotes();
      setResult("Saved");
    }
    catch(err){
      console.log(err);
    }
  }
  function openNote(note){
    setCurrentNoteId(note._id);
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags || "");
    setResult("");
  }
  function newNote(){
    setCurrentNoteId(null);
    setTitle("");
    setContent("");
    setTags("");
    setResult("");
    setStatus("");
  }
  async function summarize(){
    if(!content.trim()) return;
    try{
      setResult("Generating summary");
      const res=await axios.post(`${API_URL}/api/notes/summarize`,
        {
          text: content,
          noteId: currentNoteId
        },
        {
          withCredentials: true
        }
      );
      setResult(res.data.summary);
    }
    catch(error){
      console.log(error);
      setResult("Summary failed");
    }
  }
  async function deleteNote(){
    if(!currentNoteId){
      setStatus("Open a saved note first");
      return;
    }
    try{
      await axios.delete(`${API_URL}/api/notes/${currentNoteId}`,{
        withCredentials:true
      });
      setNotesList(prev=>prev.filter(note=>note._id!==currentNoteId));
      setCurrentNoteId(null);
      setTitle("");
      setContent("");
      setTags("");
      setResult("");
      setStatus("Note deleted");
    }
    catch(error){
      console.log("DELETE NOTE ERROR:",error);
      setStatus("Delete failed");
    }
  }
  async function copyNote(){
    try{
      if(!result.trim() || result === "Generating summary"){
        setStatus("Generate a summary first");
        return;
      }
      const plainText=result.replace(/^#{1,6}\s*/gm,"").replace(/\*\*\*(.*?)\*\*\*/gs,"$1").replace(/\*\*(.*?)\*\*/gs,"$1").replace(/\*(.*?)\*/gs,"$1").replace(/^\s*[-*+]\s+/gm,"").replace(/^\s*\d+\.\s+/gm,"").trim();
      await navigator.clipboard.writeText(plainText);
      setStatus("Copied");
    }
    catch(error){
      console.log(error);
      setStatus("Copy failed");
    }
  }
  function exportNote(){
    if(!result.trim() || result === "Generating summary"){
      setStatus("Generate a summary first");
      return;
    }
    const plainText=result.replace(/^#{1,6}\s*/gm, "").replace(/\*\*\*(.*?)\*\*\*/gs, "$1").replace(/\*\*(.*?)\*\*/gs, "$1").replace(/\*(.*?)\*/gs, "$1").replace(/^\s*[-*+]\s+/gm, "").replace(/^\s*\d+\.\s+/gm, "").trim();
    const blob=new Blob([plainText],{
      type: "text/plain"
    });
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=(title || "summary")+"-summary.txt";
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus("Summary exported");
  }
  async function importPdf(e){
    const file=e.target.files[0];
    if(!file) return;
    try{
      setResult("Reading PDF");
      const data=await file.arrayBuffer();
      const pdf=await pdfjsLib.getDocument({data}).promise;
      let text="";
      for(let num=1;num<=pdf.numPages;num++){
        const page=await pdf.getPage(num);
        const contentData=await page.getTextContent();
        text+=contentData.items.map(item => item.str).join(" ")+"\n\n";
      }
      if(text.trim().length>20){
        setTitle(file.name.replace(/\.pdf$/i, ""));
        setContent(text);
        setResult(`Imported ${pdf.numPages} pages`);
        return;
      }
      console.log("Starting OCR");
      let ocrText="";
      for(let num=1;num<=pdf.numPages;num++){
        const page=await pdf.getPage(num);
        const viewport=page.getViewport({scale: 2});
        const canvas=document.createElement("canvas");
        const context=canvas.getContext("2d");
        canvas.width=viewport.width;
        canvas.height=viewport.height;
        await page.render({canvasContext: context,viewport: viewport}).promise;
        const {data: ocrData}=await Tesseract.recognize(canvas,"eng",{
            logger:info=>{
              if(info.status==="recognizing text"){
                console.log(`OCR page ${num}:`,Math.round(info.progress * 100)+"%");
              }
            }
          }
        );
        ocrText+=ocrData.text+"\n\n";
      }
      console.log("OCR TEXT LENGTH:",ocrText.trim().length);
      if(!ocrText.trim()){
        setResult("No readable text found in PDF");
        return;
      }
      setTitle(file.name.replace(/\.pdf$/i, ""));
      setContent(ocrText);
      setResult(`Imported ${pdf.numPages} pages using OCR`);
    }
    catch(error){
      console.error("PDF IMPORT ERROR:",error);
      setResult("PDF import failed");
    }
  }
  async function importImage(e){
    const file=e.target.files[0];
    if(!file) return;
    try{
      setResult("OCR Processing");
      const{data}=await Tesseract.recognize(file,"eng");
      setContent(prev=>prev+"\n\n--- OCR TEXT ---\n\n"+data.text);
      setResult("OCR Complete");
    }
    catch{
      setResult("OCR Failed");
    }
  }
  async function handleDrop(e){
    e.preventDefault();
    const file=e.dataTransfer.files[0];
    if(!file) return;
    const fakeEvent={
      target:{
        files:[file],
      },
    };
    if(file.type.includes("pdf")){
      importPdf(fakeEvent);
    }
    else if(file.type.includes("image")){
      importImage(fakeEvent);
    }
  }
  const filtered=notesList.filter(note=>{
    const q=searchInput.toLowerCase();
    return(
      note.title.toLowerCase().includes(q) || (note.tags || "").toLowerCase().includes(q)
    );
  });
  return(
    <>
      <header className="header-synapse">
        <div className="site-title">
          Synapse
        </div>
        <div className="header-actions">
          <input
            className="input-search-notes"
            placeholder="Search notes..."
            value={searchInput}
            onChange={e=>
              setSearchInput(e.target.value)
            }
          />
          <button
            className="btn-main"
            onClick={()=>
              setDarkMode(!darkMode)
            }
          >
            {darkMode?"Light":"Dark"}
          </button>
          <button
            className="btn-main"
            onClick={newNote}
          >
            New
          </button>
          <button
            className="btn-main"
            onClick={saveNote}
          >
            Save
          </button>
          <div className="profile-container">
          <button
            className="profile-avatar"
            onClick={()=>setProfileOpen(!profileOpen)}
            title="Profile"
          >
            {user?.initials || user?.name?.charAt(0).toUpperCase() || "U"}
          </button>
          {profileOpen && (
            <div className="profile-card">
              <div className="profile-card-header">
                <div className="profile-large-avatar">
                  {user?.initials || user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <h3>{user?.name || "Synapse User"}</h3>
                  <p>{user?.email || ""}</p>
                </div>
              </div>
              <div className="profile-info">
                <div className="profile-row">
                  <span>Role</span>
                  <strong>{user?.role || "Synapse User"}</strong>
                </div>
                <div className="profile-row">
                  <span>Status</span>
                  <strong className="profile-status">
                    <span></span>
                    Active
                  </strong>
                </div>
              </div>
              <button
                className="profile-signout"
                onClick={onLogout}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
        </div>
      </header>
      <div className="app">
        <aside className="sidebar">
          <div className="panel">
            <div className="panel-title">
              Quick Actions
            </div>
            <div className="quick-actions">
              <button
                className="action-btn"
                onClick={newNote}
              >
                New Note
              </button>
              <label className="action-btn">
                Import Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={importImage}
                />
              </label>
              <label className="action-btn">
                Import PDF
                <input
                  type="file"
                  hidden
                  accept=".pdf"
                  onChange={importPdf}
                />
              </label>
              <button
                className="action-btn"
                onClick={copyNote}
              >
                Copy
              </button>
              <button
                className="action-btn"
                onClick={deleteNote}
              >
                Delete
              </button>
            </div>
          </div>
          <div className="panel notes-panel">
            <div className="panel-title">
              Saved Notes
            </div>
            <div className="notes-list">
              {filtered.map(
                (note)=>(
                  <div
                    key={note._id}
                    className="note-item"
                    onClick={()=>
                      openNote(note)
                    }
                  >
                    {note.title}
                  </div>
                )
              )}
            </div>
          </div>
          <footer className="footer">
            © 2026 Synapse
          </footer>
        </aside>
        <section
          className="workspace"
          onDrop={handleDrop}
          onDragOver={e=>
            e.preventDefault()
          }
        >
          <div className="editor-panel">
            <input
              className="note-title"
              value={title}
              placeholder="Title"
              onChange={e=>
                setTitle(e.target.value)
              }
            />
            <input
              className="note-title"
              value={tags}
              placeholder="Tags (comma separated)"
              onChange={e=>
                setTags(e.target.value)
              }
            />
            <div className="live-stats">
              <div className="stat-box">
                <b>
                  {stats.words}
                </b>{" "}
                Words
              </div>
              <div className="stat-box">
                <b>
                  {stats.chars}
                </b>{" "}
                Chars
              </div>
              <div className="stat-box">
                <b>
                  {stats.read}m
                </b>{" "}
                Read
              </div>
              <div className="stat-box">
                <b>
                  {stats.lines}
                </b>{" "}
                Lines
              </div>
            </div>
            <div className="toolbar">
              <button
                className="tool-btn"
                onClick={() => {
                  summarize();
                }}
              >
                Summarize
              </button>
              <button
                className="tool-btn"
                onClick={exportNote}
              >
                Export
              </button>
            </div>
            <textarea
              className="editor-area"
              value={content}
              placeholder="Write your notes"
              onChange={e=>
                setContent(e.target.value)
              }
            />
            {result && (
              <div className="ai-result">
                <ReactMarkdown>
                  {result}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
