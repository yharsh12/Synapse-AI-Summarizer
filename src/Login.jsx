import {useState} from "react";
import axios from "axios";
const API_URL=import.meta.env.VITE_API_URL;
export default function Login({onLogin}){
  const [mode,setMode]=useState("login");
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [confirmPassword,setConfirmPassword]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  function switchMode(newMode){
    setMode(newMode);
    setError("");
  }
  async function handleSubmit(e){
    e.preventDefault();
    setError("");
    const cleanName=name.trim();
    const cleanEmail=email.trim().toLowerCase();
    if(mode==="register"){
      if(!cleanName || !cleanEmail || !password || !confirmPassword){
        setError("Please fill in all fields.");
        return;
      }
      if(password.length<6){
        setError("Password must contain at least 6 characters.");
        return;
      }
      if(password!==confirmPassword){
        setError("Passwords do not match.");
        return;
      }
      try{
        setLoading(true);
        const res=await axios.post(`${API_URL}/api/auth/register`,
          {
            name:cleanName,
            email:cleanEmail,
            password
          },
          {
            withCredentials: true
          }
        );
        if(onLogin){
          onLogin(res.data.user);
        }
      }
      catch(err){
        setError(err.response?.data?.error || "Registration failed. Please try again.");
      }
      finally{
        setLoading(false);
      }
      return;
    }
    if(!cleanEmail || !password){
      setError("Please enter your email and password.");
      return;
    }
    try{
      setLoading(true);
      const res=await axios.post(`${API_URL}/api/auth/login`,
        {
          email:cleanEmail,
          password
        },
        {
          withCredentials: true
        }
      );
      if(onLogin){
        onLogin(res.data.user);
      }
    }
    catch(err){
      setError(err.response?.data?.error || "Login failed. Please try again.");
    }
    finally{
      setLoading(false);
    }
  }
  return(
    <div className="login-screen">
      <div className="login-card">
        <div className="site-title login-site">
          Synapse
        </div>
        <h1>
          {mode==="login" ? "Welcome back to Synapse" : "Create your Synapse account"}
        </h1>
        <p>
          {mode==="login"? "Sign in to continue to Synapse." : "Create an account to get started with Synapse."}
        </p>
        <div className="auth-tabs">
          <button
            type="button"
            className={mode==="login" ? "active" : ""}
            onClick={() => switchMode("login")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode==="register" ? "active" : ""}
            onClick={()=>switchMode("register")}
          >
            Register
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="login-form"
        >
          {mode==="register" &&(
            <label>
              Full name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                autoComplete="name"
              />
            </label>
          )}
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete={mode==="login" ? "current-password": "new-password"}
            />
          </label>
          {mode==="register" &&(
            <label>
              Confirm password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
            </label>
          )}
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}
          <button
            className="primary-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            {!loading && (
              <span style={{ marginLeft: "8px" }}>
                →
              </span>
            )}
          </button>
        </form>
        <div className="auth-switch">
          {mode==="login" ?(
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={()=>switchMode("register")}
              >
                Create one
              </button>
            </>
          ):(
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
