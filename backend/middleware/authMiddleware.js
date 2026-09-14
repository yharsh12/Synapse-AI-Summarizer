const jwt=require("jsonwebtoken");
function authMiddleware(req,res,next){
  try{
    const token=req.cookies.synapseToken;
    if(!token){
      return res.status(401).json({
        error:"Not authenticated"
      });
    }
    const decoded=jwt.verify(token,process.env.JWT_SECRET);
    req.userId=decoded.id;
    next();
  }
  catch(error){
    return res.status(401).json({error:"Not authenticated"});
  }
}
module.exports=authMiddleware;