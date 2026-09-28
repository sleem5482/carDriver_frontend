"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Map, Eye } from "lucide-react";
import Link from "next/link";
import api from "../../../lib/api";

type Trip = {
  id: string;
  driver: { id: string; full_name: string; mobile_number: string };
  vehicle: { id: string; plate_number: string; make: string; model: string };
  start_date: string;
  status: string;
  verification_status: string;
  start_odometer_image: string;
  end_odometer_image: string;
  km_used: number;
  working_hours: number;
  created_at: string;
};

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/admin/trips");
      setTrips(res.data);
    } catch (err) {
      console.error("Failed to fetch trips", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-white">Trips</h1>
          <p className="text-zinc-500 dark:text-zinc-400">View and monitor all trips</p>
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm shadow-sm dark:shadow-none">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 text-sm">
                  <th className="py-4 px-6 font-medium">Date</th>
                  <th className="py-4 px-6 font-medium">Driver</th>
                  <th className="py-4 px-6 font-medium">Vehicle</th>
                  <th className="py-4 px-6 font-medium">Status</th>
                  <th className="py-4 px-6 font-medium">Verification</th>
                  <th className="py-4 px-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((t, i) => (
                  <tr key={i} className="border-b border-zinc-100 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 text-zinc-600 dark:text-zinc-300">{t.start_date}</td>
                    <td className="py-4 px-6 font-medium text-zinc-900 dark:text-white">{t.driver?.full_name}</td>
                    <td className="py-4 px-6 text-zinc-600 dark:text-zinc-300">{t.vehicle?.plate_number}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        t.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30' : 
                        t.status === 'IN_PROGRESS' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30' : 
                        'bg-zinc-100 dark:bg-zinc-500/20 text-zinc-700 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-500/30'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        t.verification_status === 'VERIFIED' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30' : 
                        t.verification_status === 'EXCEPTION' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30' : 
                        'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30'
                      }`}>
                        {t.verification_status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link href={`/admin/trips/${t.id}`}>
                        <button className="p-2 text-zinc-400 hover:text-blue-600 dark:hover:text-white bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg transition-colors">
                          <Eye className="w-5 h-5" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {trips.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">No trips found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
