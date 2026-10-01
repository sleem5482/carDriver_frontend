"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  ArrowLeft,
  Car,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  Route,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import api from "../../../../../lib/api";

type AssignedDriver = {
  driver_id: string;
  driver_name: string;
  mobile_number: string;
  assigned_at: string;
};

type DriverEntry = {
  driver_id: string;
  driver_name: string;
  total_km: number;
  trips_count: number;
};

type TripEntry = {
  trip_id: string;
  start_date: string;
  end_date: string;
  km_used: number;
  driver_name: string;
  route_notes: string;
  status: string;
};

type Report = {
  vehicle_id: string;
  plate_number: string;
  vehicle_type: string;
  make: string;
  model: string;
  category: string;
  status: string;
  monthly_km_limit: number | null;
  assigned_driver: AssignedDriver | null;
  date_from: string;
  date_to: string;
  total_km_used: number | null;
  overtime_km: number | null;
  is_over_limit: boolean;
  drivers: DriverEntry[];
  trips: TripEntry[];
};

function today() {
  return new Date().toISOString().split("T")[0];
}

function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function VehicleReportPage() {
  const params = useParams();
  const vehicleId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(firstOfMonth());
  const [dateTo, setDateTo] = useState(today());
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(
        `/admin/vehicles/${vehicleId}/report?date_from=${dateFrom}&date_to=${dateTo}`
      );
      setReport(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e?.response?.data?.detail ?? "Failed to load report.");
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId, dateFrom, dateTo]);

  useEffect(() => {
    if (vehicleId) fetchReport();
  }, [vehicleId, fetchReport]);

  const usagePct =
    report?.monthly_km_limit && report.monthly_km_limit > 0
      ? Math.min(((report.total_km_used ?? 0) / report.monthly_km_limit) * 100, 100)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-2">
        <Link href="/admin/vehicles">
          <button className="p-2 bg-white dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors border border-zinc-200 dark:border-transparent">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Car className="w-6 h-6 text-blue-500" />
            Vehicle KM Report
          </h1>
          {report && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              {report.make} {report.model} &mdash;{" "}
              <span className="font-mono">{report.plate_number}</span>
            </p>
          )}
        </div>
      </div>

      {/* ── Date Filters ── */}
      <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mr-1">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filter by Date</span>
          </div>
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchReport}
                disabled={isLoading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)]"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Loading / Error ── */}
      {isLoading && (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {error && !isLoading && (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl text-red-600 dark:text-red-400 text-sm flex gap-2 items-start">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {report && !isLoading && (
        <>
          {/* ── Stats Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total KM */}
            <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Gauge className="w-4 h-4 text-blue-500" />
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Total KM Used
                </p>
              </div>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                {(report.total_km_used ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-zinc-400 mt-1">km in period</p>
            </div>

            {/* Monthly Limit */}
            <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Route className="w-4 h-4 text-purple-500" />
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Monthly Limit
                </p>
              </div>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">
                {report.monthly_km_limit != null
                  ? report.monthly_km_limit.toLocaleString()
                  : "—"}
              </p>
              <p className="text-xs text-zinc-400 mt-1">km / month</p>
            </div>

            {/* Overtime */}
            <div
              className={`border rounded-2xl p-5 shadow-sm ${
                report.is_over_limit
                  ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30"
                  : "bg-white dark:bg-white/5 border-zinc-200 dark:border-white/10"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle
                  className={`w-4 h-4 ${
                    report.is_over_limit ? "text-red-500" : "text-zinc-400"
                  }`}
                />
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Overtime KM
                </p>
              </div>
              <p
                className={`text-3xl font-bold ${
                  report.is_over_limit
                    ? "text-red-600 dark:text-red-400"
                    : "text-zinc-900 dark:text-white"
                }`}
              >
                {(report.overtime_km ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-zinc-400 mt-1">km over limit</p>
            </div>

            {/* Limit Status */}
            <div
              className={`border rounded-2xl p-5 shadow-sm ${
                report.is_over_limit
                  ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30"
                  : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                {report.is_over_limit ? (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Limit Status
                </p>
              </div>
              <p
                className={`text-xl font-bold ${
                  report.is_over_limit
                    ? "text-red-600 dark:text-red-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {report.is_over_limit ? "Over Limit" : "Within Limit"}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                {report.monthly_km_limit
                  ? `${usagePct?.toFixed(1)}% used`
                  : "No limit set"}
              </p>
            </div>
          </div>

          {/* ── KM Progress Bar ── */}
          {report.monthly_km_limit != null && usagePct !== null && (
            <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  KM Usage vs Monthly Limit
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {(report.total_km_used ?? 0).toLocaleString()} /{" "}
                  {report.monthly_km_limit.toLocaleString()} km
                </p>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-white/10 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-700 ${
                    report.is_over_limit
                      ? "bg-red-500"
                      : usagePct > 80
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${usagePct}%` }}
                />
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                {usagePct.toFixed(1)}% of monthly limit used in selected period
              </p>
            </div>
          )}

          {/* ── Assigned Driver ── */}
          {report.assigned_driver && (
            <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-zinc-400" />
                Assigned Driver
              </h2>
              <div className="flex items-center justify-between bg-zinc-50 dark:bg-black/20 rounded-xl p-3 border border-zinc-200 dark:border-white/5">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-white text-sm">
                    {report.assigned_driver.driver_name}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {report.assigned_driver.mobile_number}
                  </p>
                </div>
                <p className="text-xs text-zinc-400">
                  Since{" "}
                  {new Date(
                    report.assigned_driver.assigned_at
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* ── Drivers Summary ── */}
          {report.drivers.length > 0 && (
            <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-zinc-400" />
                Drivers in Period
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-white/5 bg-zinc-50/80 dark:bg-white/[0.02]">
                      <th className="py-2.5 px-4 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Driver
                      </th>
                      <th className="py-2.5 px-4 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Trips
                      </th>
                      <th className="py-2.5 px-4 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        KM Used
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                    {report.drivers.map((d) => (
                      <tr
                        key={d.driver_id}
                        className="hover:bg-zinc-50 dark:hover:bg-white/[0.025] transition-colors"
                      >
                        <td className="py-3 px-4 text-zinc-800 dark:text-zinc-200 font-medium">
                          {d.driver_name}
                        </td>
                        <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400">
                          {d.trips_count}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-zinc-900 dark:text-white">
                            {(d.total_km ?? 0).toLocaleString()}
                          </span>
                          <span className="text-xs text-zinc-400 ml-1">km</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Trips Table ── */}
          <div className="bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <Route className="w-4 h-4 text-zinc-400" />
              Trips in Period
              <span className="ml-auto text-xs font-normal text-zinc-400">
                {report.trips.length} trip{report.trips.length !== 1 ? "s" : ""}
              </span>
            </h2>
            {report.trips.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                <Route className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No trips in this date range</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-white/5 bg-zinc-50/80 dark:bg-white/[0.02]">
                      <th className="py-2.5 px-4 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="py-2.5 px-4 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Driver
                      </th>
                      <th className="py-2.5 px-4 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Route
                      </th>
                      <th className="py-2.5 px-4 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        KM
                      </th>
                      <th className="py-2.5 px-4 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                    {report.trips.map((t) => (
                      <tr
                        key={t.trip_id}
                        className="hover:bg-zinc-50 dark:hover:bg-white/[0.025] transition-colors"
                      >
                        <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 text-xs">
                          {t.start_date}
                        </td>
                        <td className="py-3 px-4 text-zinc-800 dark:text-zinc-200">
                          {t.driver_name}
                        </td>
                        <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 max-w-[200px] truncate">
                          {t.route_notes || "—"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-zinc-900 dark:text-white">
                            {(t.km_used ?? 0).toLocaleString()}
                          </span>
                          <span className="text-xs text-zinc-400 ml-1">km</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border ${
                              t.status === "COMPLETED"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : t.status === "OPEN"
                                ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                                : "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
