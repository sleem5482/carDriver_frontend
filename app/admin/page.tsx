"use client";
import { motion } from "framer-motion";
import { Activity, ShieldCheck, Zap } from "lucide-react";
import Image from "next/image";

export default function AdminDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Hero Banner using photo2 */}
      <div className="relative w-full h-64 rounded-3xl overflow-hidden shadow-2xl group">
        <Image 
          src="/photo2.jpg" 
          alt="Admin Dashboard Cover" 
          fill 
          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 p-8 flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-lg">Dashboard Overview</h1>
          <p className="text-zinc-200 text-lg max-w-md font-light">
            Welcome back! Here is what's happening with your system today. Manage vehicles, users, and trips all in one place.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-6 rounded-2xl backdrop-blur-sm flex items-start space-x-4 shadow-sm">
          <div className="p-3 bg-blue-50 dark:bg-blue-500/20 rounded-xl border border-blue-100 dark:border-blue-500/30">
            <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">System Status</h3>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">Operational</p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-6 rounded-2xl backdrop-blur-sm flex items-start space-x-4 shadow-sm">
          <div className="p-3 bg-green-50 dark:bg-green-500/20 rounded-xl border border-green-100 dark:border-green-500/30">
            <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">Active Connections</h3>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">Secured</p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-6 rounded-2xl backdrop-blur-sm flex items-start space-x-4 shadow-sm">
          <div className="p-3 bg-purple-50 dark:bg-purple-500/20 rounded-xl border border-purple-100 dark:border-purple-500/30">
            <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">API Latency</h3>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">~12ms</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
