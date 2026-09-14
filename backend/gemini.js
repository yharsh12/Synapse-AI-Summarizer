const { GoogleGenAI }=require("@google/genai");
const ai=new GoogleGenAI({
  apiKey:process.env.GEMINI_API_KEY
});
async function askGemini(prompt){
  try{
    console.log("Gemini request started");
    console.log("API key exists:", !!process.env.GEMINI_API_KEY);
    const response = await ai.models.generateContent({
      model:"gemini-3.6-flash",
      contents:prompt
    });
    console.log("Gemini response received");
    return response.text;
  }
  catch (error) {
    console.error("GEMINI API ERROR:");
    console.error(error);
    throw error;
  }
}
module.exports=askGemini;
