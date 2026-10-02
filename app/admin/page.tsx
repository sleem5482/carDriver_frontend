"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, ShieldCheck, Car, UserCheck, UserX } from "lucide-react";
import Image from "next/image";
import api from "../../lib/api";

type Stats = {
  totalVehicles: number;
  activeDrivers: number;
  inactiveDrivers: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalVehicles: 0,
    activeDrivers: 0,
    inactiveDrivers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const [vehiclesRes, driversRes] = await Promise.allSettled([
          api.get("/admin/vehicles/"),
          api.get("/admin/users/?role=DRIVER"),
        ]);

        const vehicles =
          vehiclesRes.status === "fulfilled" ? vehiclesRes.value.data : [];
        const drivers =
          driversRes.status === "fulfilled" ? driversRes.value.data : [];

        const active = drivers.filter(
          (d: { status: string }) => d.status === "ACTIVE"
        ).length;

        setStats({
          totalVehicles: vehicles.length,
          activeDrivers: active,
          inactiveDrivers: drivers.length - active,
        });
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({
    icon,
    label,
    value,
    colorClass,
    iconBg,
  }: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    colorClass: string;
    iconBg: string;
  }) => (
    <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 p-6 rounded-2xl backdrop-blur-sm flex items-start space-x-4 shadow-sm">
      <div className={`p-3 rounded-xl border ${iconBg}`}>{icon}</div>
      <div>
        <h3 className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">{label}</h3>
        <p className={`text-2xl font-bold mt-1 ${colorClass}`}>
          {isLoading ? (
            <span className="inline-block w-10 h-6 bg-zinc-200 dark:bg-white/10 animate-pulse rounded" />
          ) : (
            value
          )}
        </p>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Hero Banner */}
      <div className="relative w-full h-64 rounded-3xl overflow-hidden shadow-2xl group">
        <Image
          src="/admin-icon.jpg"
          alt="Admin Dashboard Cover"
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 p-8 flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-lg">
            Dashboard Overview
          </h1>
          <p className="text-zinc-200 text-lg max-w-md font-light">
            Welcome back! Here is what&apos;s happening with your system today. Manage
            vehicles, drivers, and trips all in one place.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* System Status – always operational */}
        <StatCard
          icon={<ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
          label="System Status"
          value={<span className="text-zinc-900 dark:text-white">Operational</span>}
          colorClass=""
          iconBg="bg-blue-50 dark:bg-blue-500/20 border-blue-100 dark:border-blue-500/30"
        />

        {/* Total Vehicles */}
        <StatCard
          icon={<Car className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
          label="Total Vehicles"
          value={
            <span className="text-zinc-900 dark:text-white">{stats.totalVehicles}</span>
          }
          colorClass=""
          iconBg="bg-purple-50 dark:bg-purple-500/20 border-purple-100 dark:border-purple-500/30"
        />

        {/* Active Drivers */}
        <StatCard
          icon={<UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />}
          label="Active Drivers"
          value={
            <span className="text-zinc-900 dark:text-white">{stats.activeDrivers}</span>
          }
          colorClass=""
          iconBg="bg-green-50 dark:bg-green-500/20 border-green-100 dark:border-green-500/30"
        />

        {/* Inactive Drivers */}
        <StatCard
          icon={<Activity className="w-6 h-6 text-red-500 dark:text-red-400" />}
          label="Inactive Drivers"
          value={
            <span className="text-zinc-900 dark:text-white">{stats.inactiveDrivers}</span>
          }
          colorClass=""
          iconBg="bg-red-50 dark:bg-red-500/20 border-red-100 dark:border-red-500/30"
        />
      </div>
    </motion.div>
  );
}
