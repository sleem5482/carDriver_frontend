"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import api from "../../../../lib/api";
// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtOvertime = (hours: number) => {
  const totalMinutes = Math.round(hours * 60);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};


export default function TripDetailsPage() {
  const params = useParams();
  const tripId = params.id as string;
  const [trip, setTrip] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (tripId) {
      fetchTrip();
    }
  }, [tripId]);

  const fetchTrip = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/admin/trips/${tripId}`);
      setTrip(res.data);
    } catch (err) {
      console.error("Failed to fetch trip", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center text-zinc-500 py-12">
        <p>Trip not found.</p>
        <Link href="/admin/trips" className="text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block">Back to Trips</Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/admin/trips">
          <button className="p-2 bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors border border-zinc-200 dark:border-transparent">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Trip Details</h1>
          {/* <p className="text-zinc-500 dark:text-zinc-400">ID: {trip.id}</p> */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info Card */}
        <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-6 rounded-2xl backdrop-blur-sm space-y-4 shadow-sm dark:shadow-none">
          <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">General Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-zinc-500 uppercase">Status</p>
              <p className="text-zinc-900 dark:text-white font-medium">{trip.status}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase">Verification</p>
              <p className="text-zinc-900 dark:text-white font-medium">{trip.verification_status}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase">Date</p>
              <p className="text-zinc-900 dark:text-white font-medium">{trip.start_date}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase">Working Hours</p>
              <p className="text-zinc-900 dark:text-white font-medium">{trip.working_hours_formatted}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase">Overtime</p>
              <p className="text-zinc-900 dark:text-white font-medium">
                {trip.overtime_hours ? (
                  <span className="text-red-500 bg-red-500/10 px-2 py-0.5 rounded text-sm">+{fmtOvertime(trip.overtime_hours)}</span>
                ) : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase">KM Used</p>
              <p className="text-zinc-900 dark:text-white font-medium">{trip.km_used} km</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase">Start Time</p>
              <p className="text-zinc-900 dark:text-white font-medium">
                {trip.start_server_time ? new Date(trip.start_server_time).toLocaleTimeString() : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase">End Time</p>
              <p className="text-zinc-900 dark:text-white font-medium">
                {trip.end_server_time ? new Date(trip.end_server_time).toLocaleTimeString() : '-'}
              </p>
            </div>
            {/* <div>
              <p className="text-xs text-zinc-500 uppercase">Start Odometer</p>
              <p className="text-zinc-900 dark:text-white font-medium">{trip.start_odometer}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase">End Odometer</p>
              <p className="text-zinc-900 dark:text-white font-medium">{trip.end_odometer}</p>
            </div> */}
            <div className="col-span-1">
              <p className="text-xs text-zinc-500 uppercase">Path</p>
              <p className="text-zinc-900 dark:text-white font-medium">{trip.route_notes}</p>
            </div>
            <div className="col-span-1">
              <p className="text-xs text-zinc-500 uppercase">Start Location</p>
              {trip.start_latitude && trip.start_longitude ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${trip.start_latitude},${trip.start_longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
                >
                  {trip.start_location}
                </a>
              ) : (
                <p className="text-zinc-900 dark:text-white font-medium">{trip.start_location}</p>
              )}
            </div>
            <div className="col-span-1">
              <p className="text-xs text-zinc-500 uppercase">End Location</p>
              {trip.end_location ? (
                trip.end_latitude && trip.end_longitude ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${trip.end_latitude},${trip.end_longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
                  >
                    {trip.end_location}
                  </a>
                ) : (
                  <p className="text-zinc-900 dark:text-white font-medium">{trip.end_location}</p>
                )
              ) : (
                <p className="text-zinc-900 dark:text-white font-medium">-</p>
              )}
            </div>
          </div>
        </div>

        {/* Entities Card */}
        <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-6 rounded-2xl backdrop-blur-sm space-y-6 shadow-sm dark:shadow-none">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">Driver</h2>
            <div className="flex justify-between items-center bg-zinc-50 dark:bg-black/20 p-3 rounded-xl border border-zinc-200 dark:border-white/5">
              <span className="text-zinc-700 dark:text-zinc-300">{trip.driver?.full_name}</span>
              <span className="text-zinc-500 text-sm">{trip.driver?.mobile_number}</span>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">Vehicle</h2>
            <div className="flex justify-between items-center bg-zinc-50 dark:bg-black/20 p-3 rounded-xl border border-zinc-200 dark:border-white/5">
              <span className="text-zinc-700 dark:text-zinc-300">{trip.vehicle?.make} {trip.vehicle?.model}</span>
              <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-md text-sm border border-blue-200 dark:border-blue-500/30 font-mono">
                {trip.vehicle?.plate_number}
              </span>
            </div>
          </div>
        </div>

        {/* Images Card */}
        <div className="col-span-1 md:col-span-2 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-6 rounded-2xl backdrop-blur-sm shadow-sm dark:shadow-none">
          <h2 className="text-xl font-semibold mb-6 text-zinc-900 dark:text-white flex items-center">
            <ImageIcon className="w-5 h-5 mr-2 text-zinc-400" />
            Odometer Images
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider">Start Odometer</p>
              {trip.start_odometer_image ? (
                <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/40 aspect-video relative flex items-center justify-center p-2">
                  <img src={trip.start_odometer_image} alt="Start Odometer" className="max-w-full max-h-full object-contain" />
                  {trip.start_odometer !== null && trip.start_odometer !== undefined && (
                    <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm font-semibold border border-white/20 shadow-lg">
                      {trip.start_odometer} km
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-200 dark:border-white/10 border-dashed bg-zinc-50 dark:bg-black/20 aspect-video flex items-center justify-center text-zinc-500">
                  No Image Provided
                </div>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider">End Odometer</p>
              {trip.end_odometer_image ? (
                <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/40 aspect-video relative flex items-center justify-center p-2">
                  <img src={trip.end_odometer_image} alt="End Odometer" className="max-w-full max-h-full object-contain" />
                  {trip.end_odometer !== null && trip.end_odometer !== undefined && (
                    <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm font-semibold border border-white/20 shadow-lg">
                      {trip.end_odometer} km
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-200 dark:border-white/10 border-dashed bg-zinc-50 dark:bg-black/20 aspect-video flex items-center justify-center text-zinc-500">
                  No Image Provided
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
