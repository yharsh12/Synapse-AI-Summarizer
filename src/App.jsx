import {useEffect,useState} from "react";
import axios from "axios";
import Synapse from "./Synapse";
import Login from "./Login";
const API_URL=import.meta.env.VITE_API_URL;
function App(){
  const [user,setUser]=useState(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    async function checkAuth(){
      try{
        const res=await axios.get(
          `${API_URL}/api/auth/me`,
          {
            withCredentials:true
          }
        );
        setUser(res.data.user);
      }
      catch(error){
        setUser(null);
      }
      finally{
        setLoading(false);
      }
    }
    checkAuth();
  },[]);
  function handleLogin(userData){
    setUser(userData);
  }
  async function handleLogout(){
    try{
      await axios.post(
        `${API_URL}/api/auth/logout`,
        {},
        {
          withCredentials:true
        }
      );
    }
    catch(error){
      console.log("Logout error:",error);
    }
    setUser(null);
  }
  if(loading){
    return null;
  }
  if(!user){
    return <Login onLogin={handleLogin}/>;
  }
  return(
    <Synapse
      user={user}
      onLogout={handleLogout}
    />
  );
}
export default App;
