"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2, Edit2, Trash2, X, Car, BarChart2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import api from "../../../lib/api";

type Vehicle = {
  id?: string;
  vehicle_type: string;
  make: string;
  model: string;
  plate_number: string;
  category: string;
  monthly_km: number | null;
  daily_shift_hours: number | null;
  status: string;
};

const STATUS_OPTIONS = ["AVAILABLE", "ASSIGNED", "NOT_AVAILABLE"] as const;

const statusConfig: Record<string, { label: string; cls: string }> = {
  AVAILABLE: {
    label: "Available",
    cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  ASSIGNED: {
    label: "Assigned",
    cls: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  NOT_AVAILABLE: {
    label: "Not Available",
    cls: "bg-red-500/15 text-red-400 border-red-500/30",
  },
};

const emptyForm: Vehicle = {
  vehicle_type: "",
  make: "",
  model: "",
  plate_number: "",
  category: "",
  monthly_km: null,
  daily_shift_hours: null,
  status: "AVAILABLE",
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Vehicle>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => { fetchVehicles(); }, []);

  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/admin/vehicles/");
      setVehicles(res.data);
    } catch (err) {
      console.error("Failed to fetch vehicles", err);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormError(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (v: Vehicle) => {
    setEditingId(v.id!);
    setFormError(null);
    setFormData({ vehicle_type: v.vehicle_type, make: v.make, model: v.model, plate_number: v.plate_number, category: v.category, monthly_km: v.monthly_km, daily_shift_hours: v.daily_shift_hours, status: v.status });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingId) {
        await api.put(`/admin/vehicles/${editingId}`, formData);
      } else {
        await api.post("/admin/vehicles/", formData);
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err: unknown) {
      let message = "An unexpected error occurred. Please try again.";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { status?: number; data?: { detail?: unknown; message?: string } } };
        const status = axiosErr.response?.status;
        const detail = axiosErr.response?.data?.detail;
        const serverMessage = axiosErr.response?.data?.message;
        if (status === 409) {
          message = (typeof detail === "string" ? detail : null) || serverMessage || "A vehicle with this plate number already exists.";
        } else if (status === 422 && Array.isArray(detail)) {
          message = detail.map((e: { loc?: string[]; msg?: string }) => {
            const field = e.loc ? e.loc.filter(l => l !== "body").join(" → ") : "";
            return field ? `${field}: ${e.msg}` : e.msg || "Validation error";
          }).join("\n");
        } else if (typeof detail === "string") {
          message = detail;
        } else if (serverMessage) {
          message = serverMessage;
        }
      }
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this vehicle?")) return;
    try {
      await api.delete(`/admin/vehicles/${id}`);
      fetchVehicles();
    } catch (err: unknown) {
      let message = "Failed to delete vehicle.";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: unknown } } };
        const detail = axiosErr.response?.data?.detail;
        if (typeof detail === "string") message = detail;
      }
      alert(message);
    }
  };

  const handleToggleAvailability = async (v: Vehicle) => {
    if (v.status === "ASSIGNED") {
      alert("Unassign the driver first before changing availability.");
      return;
    }
    setTogglingId(v.id!);
    try {
      await api.patch(`/admin/vehicles/${v.id}/availability`, { is_available: v.status !== "AVAILABLE" });
      fetchVehicles();
    } catch (err: unknown) {
      let message = "Failed to update availability.";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: unknown } } };
        const detail = axiosErr.response?.data?.detail;
        if (typeof detail === "string") message = detail;
      }
      alert(message);
    } finally {
      setTogglingId(null);
    }
  };

  const totalCount = vehicles.length;
  const availableCount = vehicles.filter(v => v.status === "AVAILABLE").length;
  const assignedCount = vehicles.filter(v => v.status === "ASSIGNED").length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* App icon */}
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg ring-2 ring-blue-500/20 flex-shrink-0">
            <Image
              src="/admin-icon.jpg"
              alt="Vehicle Fleet Admin"
              width={56}
              height={56}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Vehicles</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Manage all registered vehicles</p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]"
        >
          <Plus className="w-4 h-4" />
          Add Vehicle
        </button>
      </div>

      {/* ── Stats row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: totalCount, color: "text-zinc-900 dark:text-white", bg: "bg-white dark:bg-white/5 border-zinc-200 dark:border-white/10" },
          { label: "Available", value: availableCount, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20" },
          { label: "Assigned", value: assignedCount, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border rounded-2xl p-4 flex items-center gap-4`}>
            <div className="flex-1">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
            <Car className={`w-7 h-7 opacity-30 ${s.color}`} />
          </div>
        ))}
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-white/5 bg-zinc-50/80 dark:bg-white/[0.02]">
                  <th className="py-3 px-5 text-left font-semibold text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">Plate</th>
                  <th className="py-3 px-5 text-left font-semibold text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">Model Year</th>
                  <th className="py-3 px-5 text-left font-semibold text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">Name</th>
                  <th className="py-3 px-5 text-left font-semibold text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">Type</th>
                  <th className="py-3 px-5 text-left font-semibold text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">Category</th>
                  <th className="py-3 px-5 text-left font-semibold text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">Monthly KM</th>
                  <th className="py-3 px-5 text-left font-semibold text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">Shift (hrs)</th>
                  <th className="py-3 px-5 text-left font-semibold text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">Status</th>
                  <th className="py-3 px-5 text-center font-semibold text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">Available</th>
                  <th className="py-3 px-5 text-right font-semibold text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                {vehicles.map((v) => {
                  const sc = statusConfig[v.status] ?? statusConfig["NOT_AVAILABLE"];
                  const isAvailable = v.status === "AVAILABLE";
                  const isAssigned = v.status === "ASSIGNED";
                  const isToggling = togglingId === v.id;

                  return (
                    <tr key={v.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.025] transition-colors group">
                      {/* Plate */}
                      <td className="py-3.5 px-5">
                        <span className="font-mono font-bold text-zinc-900 dark:text-white text-sm tracking-wide">{v.plate_number}</span>
                      </td>
                      {/* Make & Model */}
                      <td className="py-3.5 px-5">
                        <span className="text-zinc-700 dark:text-zinc-300">{v.make}</span>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="text-zinc-700 dark:text-zinc-300">{v.model}</span>
                      </td>
                      {/* Type */}
                      <td className="py-3.5 px-5">
                        <span className="text-zinc-500 dark:text-zinc-400">{v.vehicle_type}</span>
                      </td>
                      {/* Category */}
                      <td className="py-3.5 px-5">
                        <span className="text-zinc-500 dark:text-zinc-400">{v.category || "—"}</span>
                      </td>
                      {/* Monthly KM */}
                      <td className="py-3.5 px-5">
                        {v.monthly_km != null ? (
                          <span className="inline-flex items-center gap-1 text-zinc-700 dark:text-zinc-300 font-medium">
                            {v.monthly_km.toLocaleString()}
                            <span className="text-xs text-zinc-400">km</span>
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      {/* Shift Hours */}
                      <td className="py-3.5 px-5">
                        {v.daily_shift_hours != null ? (
                          <span className="inline-flex items-center gap-1 text-zinc-700 dark:text-zinc-300 font-medium">
                            {v.daily_shift_hours}
                            <span className="text-xs text-zinc-400">h</span>
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      {/* Status badge */}
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold border ${sc.cls}`}>
                          {sc.label}
                        </span>
                      </td>
                      {/* Availability toggle */}
                      <td className="py-3.5 px-5 text-center">
                        <button
                          onClick={() => handleToggleAvailability(v)}
                          disabled={isToggling || isAssigned}
                          title={isAssigned ? "Unassign driver first" : isAvailable ? "Mark as Not Available" : "Mark as Available"}
                          className="relative inline-flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none"
                        >
                          {isToggling ? (
                            <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                          ) : (
                            <span className={`flex w-11 h-6 rounded-full transition-colors duration-200 ${
                              isAvailable ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
                            }`}>
                              <span className={`inline-block w-5 h-5 my-0.5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                                isAvailable ? "translate-x-5" : "translate-x-0.5"
                              }`} />
                            </span>
                          )}
                        </button>
                      </td>
                      {/* Actions */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/vehicles/${v.id}/report`}
                            title="View Report"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors"
                          >
                            <BarChart2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => openEditModal(v)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(v.id!)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {vehicles.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-zinc-400 dark:text-zinc-500">
                      <Car className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No vehicles found</p>
                      <p className="text-xs mt-1">Click &quot;Add Vehicle&quot; to get started</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ───────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Car className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                    {editingId ? "Edit Vehicle" : "Add New Vehicle"}
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal body */}
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm flex gap-2">
                    <span className="shrink-0 mt-0.5">⚠️</span>
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Model Year">
                    <input required value={formData.make} onChange={e => setFormData({ ...formData, make: e.target.value })} className={inputCls} placeholder="e.g. Toyota" />
                  </Field>
                  <Field label="Name">
                    <input required value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} className={inputCls} placeholder="e.g. Camry" />
                  </Field>
                </div>

                <Field label="Plate Number">
                  <input required value={formData.plate_number} onChange={e => setFormData({ ...formData, plate_number: e.target.value })} className={`${inputCls} font-mono`} placeholder="e.g. ABC-1234" />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Type">
                    <input required value={formData.vehicle_type} onChange={e => setFormData({ ...formData, vehicle_type: e.target.value })} className={inputCls} placeholder="e.g. Sedan" />
                  </Field>
                  <Field label="Category">
                    <input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className={inputCls} placeholder="e.g. Economy" />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Monthly KM Limit">
                    <input
                      type="number"
                      min="0"
                      value={formData.monthly_km ?? ""}
                      onChange={e => setFormData({ ...formData, monthly_km: e.target.value === "" ? null : parseFloat(e.target.value) })}
                      className={inputCls}
                      placeholder="e.g. 3000"
                    />
                  </Field>
                  <Field label="Daily Shift (Hours)">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.daily_shift_hours ?? ""}
                      onChange={e => setFormData({ ...formData, daily_shift_hours: e.target.value === "" ? null : parseFloat(e.target.value) })}
                      className={inputCls}
                      placeholder="e.g. 8"
                    />
                  </Field>
                </div>

                <Field label="Status">
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className={inputCls}>
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{statusConfig[s]?.label ?? s}</option>
                    ))}
                  </select>
                </Field>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-white/10 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {isSubmitting ? "Saving…" : editingId ? "Save Changes" : "Create Vehicle"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Helpers ────────────────────────────────────────────────
const inputCls =
  "w-full bg-zinc-50 dark:bg-black/30 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
