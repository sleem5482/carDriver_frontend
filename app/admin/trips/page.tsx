"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, SlidersHorizontal, X, Search, Map, ChevronDown } from "lucide-react";
import Link from "next/link";
import api from "../../../lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type Trip = {
  id: string;
  driver: { id: string; full_name: string; mobile_number: string };
  vehicle: { id: string; plate_number: string; make: string; model: string; vehicle_type?: string };
  start_date: string;
  status: string;
  verification_status: string;
  route_notes?: string;
  km_used: number;
  working_hours: number;
  working_hours_formatted?: string;
  overtime_hours?: number;
  created_at: string;
};

type Filters = {
  date_from: string;
  date_to: string;
  plate_number: string;
  driver_id: string;
  vehicle_id: string;
  status: string;
  verification_status: string;
};

const EMPTY_FILTERS: Filters = {
  date_from: "",
  date_to: "",
  plate_number: "",
  driver_id: "",
  vehicle_id: "",
  status: "",
  verification_status: "",
};

// ─── Badge helpers ────────────────────────────────────────────────────────────

const statusCls = (s: string) => {
  if (s === "COMPLETED") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (s === "IN_PROGRESS") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  if (s === "OPEN") return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
  return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
};

const verifCls = (s: string) => {
  if (s === "VERIFIED") return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (s === "EXCEPTION") return "bg-red-500/15 text-red-400 border-red-500/30";
  if (s === "PENDING_REVIEW") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
};

const fmtDate = (iso: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const [drivers, setDrivers] = useState<{ id: string; full_name: string }[]>([]);
  const [vehicles, setVehicles] = useState<{ id: string; plate_number: string; make: string; model: string }[]>([]);

  const activeFilterCount = Object.values(applied).filter(Boolean).length;

  const fetchTrips = useCallback(async (f: Filters) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (f.date_from)            params.date_from            = f.date_from;
      if (f.date_to)              params.date_to              = f.date_to;
      if (f.plate_number.trim())  params.plate_number         = f.plate_number.trim();
      if (f.driver_id)            params.driver_id            = f.driver_id;
      if (f.vehicle_id)           params.vehicle_id           = f.vehicle_id;
      if (f.status)               params.status               = f.status;
      if (f.verification_status)  params.verification_status  = f.verification_status;

      const res = await api.get("/admin/trips", { params });
      setTrips(res.data);
    } catch (err) {
      console.error("Failed to fetch trips", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [dRes, vRes] = await Promise.all([
          api.get("/admin/users/?role=DRIVER"),
          api.get("/admin/vehicles")
        ]);
        setDrivers(dRes.data);
        setVehicles(vRes.data);
      } catch (err) {
        console.error("Failed to fetch filter options", err);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchTrips(applied);
  }, [
    applied.date_from,
    applied.date_to,
    applied.plate_number,
    applied.driver_id,
    applied.vehicle_id,
    applied.status,
    applied.verification_status,
    fetchTrips,
  ]);

  const applyFilters = () => {
    setApplied({ ...filters });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setShowFilters(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Trips</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">View and monitor all trips</p>
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-zinc-500 dark:text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-zinc-200 dark:border-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear filters
            </button>
          )}
          <button
            onClick={() => { setFilters(applied); setShowFilters(v => !v); }}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              showFilters || activeFilterCount > 0
                ? "bg-blue-600 text-white border-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                : "bg-white dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-500/50"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-blue-600 text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Filter Panel ────────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 rounded-2xl p-5 shadow-sm"
          >
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">Filter Trips</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

              {/* Date From */}
              <div className="space-y-1.5">
                <label className={labelCls}>Date From</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))}
                  className={inputCls}
                />
              </div>

              {/* Date To */}
              <div className="space-y-1.5">
                <label className={labelCls}>Date To</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))}
                  className={inputCls}
                />
              </div>

              {/* Plate Number */}
              <div className="space-y-1.5">
                <label className={labelCls}>Plate Number</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="e.g. ABC-1234"
                    value={filters.plate_number}
                    onChange={e => setFilters(f => ({ ...f, plate_number: e.target.value }))}
                    className={`${inputCls} pl-8 font-mono`}
                  />
                </div>
              </div>

              {/* Driver Dropdown */}
              <div className="space-y-1.5">
                <label className={labelCls}>Driver</label>
                <SearchableSelect
                  options={drivers.map(d => ({ label: d.full_name, value: d.id }))}
                  value={filters.driver_id}
                  onChange={val => setFilters(f => ({ ...f, driver_id: val }))}
                  placeholder="All Drivers"
                  className={inputCls}
                />
              </div>

              {/* Vehicle Dropdown */}
              <div className="space-y-1.5">
                <label className={labelCls}>Vehicle</label>
                <SearchableSelect
                  options={vehicles.map(v => ({ label: `${v.plate_number} (${v.make} ${v.model})`, value: v.id }))}
                  value={filters.vehicle_id}
                  onChange={val => setFilters(f => ({ ...f, vehicle_id: val }))}
                  placeholder="All Vehicles"
                  className={inputCls}
                />
              </div>

              {/* Trip Status */}
              <div className="space-y-1.5">
                <label className={labelCls}>Trip Status</label>
                <select
                  value={filters.status}
                  onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              {/* Action buttons */}
              <div className="col-span-2 md:col-span-3 flex justify-end gap-3 mt-2">
                <button
                  onClick={clearFilters}
                  className="px-6 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/10 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={applyFilters}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-[0_0_15px_rgba(59,130,246,0.25)]"
                >
                  Apply Filters
                </button>
              </div>
            </div>

            {/* Active filter pills */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-zinc-100 dark:border-white/5">
                <span className="text-xs text-zinc-500 dark:text-zinc-400 self-center">Active:</span>
                {applied.date_from && <Pill label={`From: ${applied.date_from}`} onRemove={() => setApplied(f => ({ ...f, date_from: "" }))} />}
                {applied.date_to && <Pill label={`To: ${applied.date_to}`} onRemove={() => setApplied(f => ({ ...f, date_to: "" }))} />}
                {applied.plate_number && <Pill label={`Plate: ${applied.plate_number}`} onRemove={() => setApplied(f => ({ ...f, plate_number: "" }))} />}
                {applied.driver_id && <Pill label={`Driver: ${drivers.find(d => d.id === applied.driver_id)?.full_name || applied.driver_id}`} onRemove={() => setApplied(f => ({ ...f, driver_id: "" }))} />}
                {applied.vehicle_id && <Pill label={`Vehicle: ${vehicles.find(v => v.id === applied.vehicle_id)?.plate_number || applied.vehicle_id}`} onRemove={() => setApplied(f => ({ ...f, vehicle_id: "" }))} />}
                {applied.status && <Pill label={`Status: ${applied.status}`} onRemove={() => setApplied(f => ({ ...f, status: "" }))} />}
                {applied.verification_status && <Pill label={`Verification: ${applied.verification_status}`} onRemove={() => setApplied(f => ({ ...f, verification_status: "" }))} />}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-white/5 bg-zinc-50/80 dark:bg-white/[0.02]">
                  <th className={thCls}>Date</th>
                  <th className={thCls}>Driver</th>
                  <th className={thCls}>Vehicle</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Overtime</th>
                  <th className={thCls}>KM Used</th>
                  <th className={thCls}>Total Hours</th>
                  <th className={`${thCls} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                {trips.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.025] transition-colors">
                    {/* Date */}
                    <td className="py-3.5 px-5 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                      {fmtDate(t.start_date)}
                    </td>
                    {/* Driver */}
                    <td className="py-3.5 px-5">
                      <span className="font-medium text-zinc-900 dark:text-white">{t.driver?.full_name ?? "—"}</span>
                    </td>
                    {/* Vehicle */}
                    <td className="py-3.5 px-5">
                      {t.vehicle ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono font-bold text-zinc-900 dark:text-white tracking-wide">
                            {t.vehicle.make} <span className="font-medium">{t.vehicle.model}</span>
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {t.vehicle.plate_number}
                          </span>
                        </div>
                      ) : "—"}
                    </td>
                    {/* Trip Status */}
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusCls(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    {/* Overtime */}
                    <td className="py-3.5 px-5">
                      {t.overtime_hours ? (
                        <span className="text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-md text-xs">
                          {t.overtime_hours}h
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-sm">—</span>
                      )}
                    </td>
                    {/* KM Used */}
                    <td className="py-3.5 px-5">
                      <span className="text-zinc-900 dark:text-white font-medium">
                        {t.km_used ? t.km_used.toLocaleString() : "0"}
                      </span>
                      <span className="text-xs text-zinc-400 ml-1">km</span>
                    </td>
                    {/* Total Hours */}
                    <td className="py-3.5 px-5">
                      <span className="text-zinc-600 dark:text-zinc-400 font-medium text-sm">
                        {t.working_hours_formatted || "—"}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <Link href={`/admin/trips/${t.id}`}>
                        <button className="p-1.5 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors" title="View details">
                          <Eye className="w-4 h-4" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {trips.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-zinc-400 dark:text-zinc-500">
                      <Map className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No trips found</p>
                      {activeFilterCount > 0 && (
                        <p className="text-xs mt-1">Try adjusting or clearing your filters</p>
                      )}
                    </td>
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

// ─── Shared styles ────────────────────────────────────────────────────────────
const labelCls = "block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider";
const inputCls = "w-full bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition";
const thCls = "py-3 px-5 text-left font-semibold text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider";

// ─── Pill component ───────────────────────────────────────────────────────────
function Pill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-lg border border-blue-200 dark:border-blue-500/30">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ─── Searchable Select Component ──────────────────────────────────────────────
function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  className
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`${className} cursor-pointer flex items-center justify-between`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? "truncate" : "text-zinc-500 truncate"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0 ml-2" />
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl shadow-lg max-h-60 flex flex-col">
          <div className="p-2 border-b border-zinc-100 dark:border-white/10 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
                className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition"
              />
            </div>
          </div>
          <div className="overflow-y-auto p-1 overflow-x-hidden">
            <div
              className={`px-3 py-2 text-sm rounded-lg cursor-pointer truncate ${value === "" ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-medium" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5"}`}
              onClick={() => {
                onChange("");
                setIsOpen(false);
                setSearch("");
              }}
            >
              {placeholder}
            </div>
            {filteredOptions.map(o => (
              <div
                key={o.value}
                title={o.label}
                className={`px-3 py-2 text-sm rounded-lg cursor-pointer truncate ${value === o.value ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-medium" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5"}`}
                onClick={() => {
                  onChange(o.value);
                  setIsOpen(false);
                  setSearch("");
                }}
              >
                {o.label}
              </div>
            ))}
            {filteredOptions.length === 0 && (
              <div className="px-3 py-3 text-sm text-zinc-500 text-center">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

