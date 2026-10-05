"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, User, ArrowRight, ShieldCheck } from "lucide-react"; // Changed Mail to User
import api from "../lib/api";

export default function AdminEntryPoint() {
  const [showSplash, setShowSplash] = useState(true);
  const [username, setUsername] = useState(""); // Changed email to username
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Hide splash screen after 10 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Call actual login endpoint
      // Note: If your backend uses FastAPI's OAuth2PasswordBearer, you might need to send this as FormData instead
      const response = await api.post('/auth/admin-login', { username, password }); // Changed email to username
      
      // Usually auth endpoints return access_token or token
      const token = response.data.access_token || response.data.token;
      if (token) {
        localStorage.setItem('admin_token', token);
      }
      
      // Redirect to admin dashboard
      window.location.href = '/admin';
      
    } catch (err: any) {
      // Backend might send 'detail' for Fastapi, or 'message'
      setError(err.response?.data?.message || err.response?.data?.detail || "Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-[#0a0a0a] overflow-hidden text-white flex items-center justify-center font-sans">
      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black"
          >
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <video
                src="/splash_login.mp4"
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="login-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex flex-col items-center justify-center w-full h-full"
          >
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <Image 
                src="/background_login.jpg" 
                alt="Login Background" 
                fill 
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black/30" />
            </div>

            <motion.div
              key="login-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="w-full max-w-md px-6 z-10"
            >
              <div className="backdrop-blur-2xl bg-white/10 border border-white/20 p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                
                <div className="flex flex-col items-center mb-8">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                    <ShieldCheck className="w-8 h-8 text-blue-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                  <p className="text-zinc-300 text-sm text-center">Authenticate to access the configuration dashboard</p>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm flex items-center"
                  >
                    <span className="flex-1">{error}</span>
                  </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300 ml-1 uppercase tracking-wider">Username</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-zinc-400 group-focus-within:text-blue-400 transition-colors" />
                      </div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all"
                        placeholder="admin"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300 ml-1 uppercase tracking-wider">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-zinc-400 group-focus-within:text-blue-400 transition-colors" />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-semibold shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] transition-all disabled:opacity-70 disabled:cursor-not-allowed group mt-4"
                  >
                    {isLoading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Login</span>
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </div>
              
              <p className="text-center text-xs text-zinc-400 mt-8 drop-shadow-md">
                &copy; {new Date().getFullYear()} Car Driver System. All rights reserved.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
