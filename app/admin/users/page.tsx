"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Loader2, Key, Edit, Trash2, X,
  User as UserIcon, Phone, Mail, ShieldCheck,
  Car, Calendar, Hash, FileText, ChevronRight,
  CheckCircle, XCircle,
} from "lucide-react";
import api from "../../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type VehicleBasic = {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  status?: string;
};

type User = {
  id?: string;
  full_name: string;
  mobile_number: string;
  email: string;
  role: string;
  status: string;
  notes?: string;
  generated_code?: string;
  created_at?: string;
  assigned_vehicle?: VehicleBasic | null;
};

type UserDetail = User & {
  updated_at?: string;
  available_vehicles?: VehicleBasic[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusBadge = (status: string) => {
  const base = "px-3 py-1 text-xs font-semibold rounded-full border inline-flex items-center gap-1.5";
  if (status === "ACTIVE" || status === "AVAILABLE")
    return `${base} bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30`;
  if (status === "ASSIGNED")
    return `${base} bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30`;
  return `${base} bg-zinc-100 dark:bg-zinc-500/20 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-500/30`;
};

const roleBadge =
  "px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30";

const fmtDate = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<VehicleBasic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Detail drawer
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Create / Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [createdUserCode, setCreatedUserCode] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User> & { password?: string; vehicle_id?: string; _assignedVehicle?: VehicleBasic }>({
    full_name: "",
    mobile_number: "",
    email: "",
    role: "DRIVER",
    status: "ACTIVE",
    notes: "",
    password: "",
    vehicle_id: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    fetchUsers();
    fetchVehicles();
  }, []);

  // ── Data fetchers ──────────────────────────────────────────────────────────

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/admin/users/?role=DRIVER");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await api.get("/admin/vehicles");
      // Keep AVAILABLE vehicles for the dropdown; assigned vehicle is added separately
      setVehicles((res.data as VehicleBasic[]).filter((v) => v.status === "AVAILABLE"));
    } catch (err) {
      console.error("Failed to fetch vehicles", err);
    }
  };
// console.log(selectedUser?.assigned_vehicle,"sdjflsfjlskfjlsjdlfkl")

  const openDetail = async (userId: string) => {
    setIsDetailOpen(true);
    setIsDetailLoading(true);
    setSelectedUser(null);
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setSelectedUser(res.data);
    } catch (err) {
      console.error("Failed to fetch user detail", err);
      setIsDetailOpen(false);
    } finally {
      setIsDetailLoading(false);
    }
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────

  const openCreateModal = async () => {
    setEditingUserId(null);
    setFormError(null);
    setFormData({ full_name: "", mobile_number: "", email: "", role: "DRIVER", status: "ACTIVE", notes: "", password: "", vehicle_id: "" });
    // Load vehicles BEFORE opening so the dropdown is populated immediately
    try {
      const res = await api.get("/admin/vehicles");
      setVehicles((res.data as VehicleBasic[]).filter((v) => v.status === "AVAILABLE"));
    } catch (err) {
      console.error("Failed to fetch vehicles", err);
    }
    setIsModalOpen(true);
  };

  const openEditModal = async (e: React.MouseEvent, user: User | UserDetail) => {
    e.stopPropagation();
    setFormError(null);

    // Fetch full user detail AND available vehicles BEFORE opening the modal
    // This prevents a race condition where setFormData (from async fetch) would
    // overwrite the user's vehicle selection if they interacted with the form quickly.
    let fullUser: UserDetail = user as UserDetail;
    try {
      const [userRes, vehicleRes] = await Promise.all([
        api.get(`/admin/users/${user.id}`),
        api.get("/admin/vehicles"),
      ]);
      fullUser = userRes.data;
      setVehicles((vehicleRes.data as VehicleBasic[]).filter((v) => v.status === "AVAILABLE"));
      // Update the detail panel too if it's showing the same user
      if (selectedUser?.id === user.id) setSelectedUser(fullUser);
    } catch (err) {
      console.error("Failed to fetch user detail for edit", err);
    }

    setEditingUserId(user.id!);
    setFormData({
      full_name: fullUser.full_name,
      mobile_number: fullUser.mobile_number,
      email: fullUser.email,
      role: fullUser.role,
      status: fullUser.status,
      notes: fullUser.notes,
      password: "",
      vehicle_id: fullUser.assigned_vehicle?.id || "",
      _assignedVehicle: fullUser.assigned_vehicle ?? undefined,
    });
    setIsModalOpen(true); // open modal AFTER data is ready
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      if (selectedUser?.id === id) setIsDetailOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      console.error("Failed to delete user", err);
      let message = "Failed to delete user. Please try again.";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: unknown } } };
        const detail = axiosErr.response?.data?.detail;
        if (typeof detail === "string") message = detail;
      }
      alert(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const payload: Record<string, unknown> = {
      full_name: formData.full_name,
      mobile_number: formData.mobile_number,
      email: formData.email,
      role: formData.role,
      status: formData.status,
      notes: formData.notes || "",
    };

    // Send vehicle_id if a vehicle is selected; send null explicitly to unassign
    if (formData.vehicle_id) {
      payload.vehicle_id = formData.vehicle_id;
    } else {
      // Only send null on update (to unassign); don't send on create if blank
      if (editingUserId) payload.vehicle_id = null;
    }

    if (editingUserId && formData.password) payload.password = formData.password;

    try {
      if (editingUserId) {
        await api.put(`/admin/users/${editingUserId}`, payload);
      } else {
        const res = await api.post("/admin/users", payload);
        if (res.data?.generated_code) setCreatedUserCode(res.data.generated_code);
      }
      setIsModalOpen(false);
      fetchUsers();
      // Refresh detail panel if open
      if (editingUserId && selectedUser?.id === editingUserId) openDetail(editingUserId);
    } catch (err: unknown) {
      let message = "An unexpected error occurred. Please try again.";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { status?: number; data?: { detail?: unknown; message?: string } } };
        const status = axiosErr.response?.status;
        const detail = axiosErr.response?.data?.detail;
        const serverMessage = axiosErr.response?.data?.message;
        if (status === 409) {
          message = (typeof detail === "string" ? detail : null) || serverMessage || "A user with this email or mobile number already exists.";
        } else if (status === 422) {
          if (Array.isArray(detail)) {
            message = detail.map((e: { loc?: string[]; msg?: string }) => {
              const field = e.loc ? e.loc.filter((l) => l !== "body").join(" → ") : "";
              return field ? `${field}: ${e.msg}` : e.msg || "Validation error";
            }).join("\n");
          } else if (typeof detail === "string") {
            message = detail;
          } else {
            message = serverMessage || "Invalid data. Please check the form fields.";
          }
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-white">Drivers</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Click any row to view full details</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add Driver</span>
        </button>
      </div>

      {/* Table */}
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
                  <th className="py-4 px-6 font-medium">Name</th>
                  <th className="py-4 px-6 font-medium">Contact</th>
                  <th className="py-4 px-6 font-medium">Status</th>
                  <th className="py-4 px-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr
                    key={i}
                    onClick={() => openDetail(u.id!)}
                    className="border-b border-zinc-100 dark:border-white/5 hover:bg-blue-50/60 dark:hover:bg-blue-500/5 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6 font-medium text-zinc-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        {u.full_name}
                        <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </td>
                    <td className="py-4 px-6 text-zinc-600 dark:text-zinc-300">
                      <div className="flex flex-col">
                        <span>{u.email}</span>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">{u.mobile_number}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={statusBadge(u.status)}>
                        {u.status === "ACTIVE" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {u.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => openEditModal(e, u)} className="p-2 text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => handleDelete(e, u.id!)} className="p-2 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-500">No drivers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detail Drawer ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isDetailOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 h-full z-50 w-full max-w-md bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider">Driver Details</p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight">
                      {selectedUser?.full_name ?? "Loading…"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {isDetailLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : selectedUser ? (
                  <>
                    {/* Status row */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={statusBadge(selectedUser.status)}>
                        {selectedUser.status === "ACTIVE" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {selectedUser.status}
                      </span>
                    </div>

                    {/* Info Cards */}
                    <div className="space-y-3">
                      {/* Personal Info */}
                      <Section title="Personal Information">
                        <InfoRow icon={<UserIcon className="w-4 h-4" />} label="Full Name" value={selectedUser.full_name} />
                        <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={selectedUser.email} />
                        <InfoRow icon={<Phone className="w-4 h-4" />} label="Mobile" value={selectedUser.mobile_number} />
                      </Section>

                      {/* Account */}
                      <Section title="Account">
                        <InfoRow icon={<Hash className="w-4 h-4" />} label="Generated Code" value={
                          <span className="font-mono font-bold text-green-600 dark:text-green-400 tracking-widest text-base">
                            {selectedUser.generated_code || "—"}
                          </span>
                        } />
                        {/* <InfoRow icon={<ShieldCheck className="w-4 h-4" />} label="User ID" value={
                          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 break-all">{selectedUser.id}</span>
                        } /> */}
                        <InfoRow icon={<Calendar className="w-4 h-4" />} label="Created" value={fmtDate(selectedUser.created_at)} />
                        <InfoRow icon={<Calendar className="w-4 h-4" />} label="Updated" value={fmtDate(selectedUser.updated_at)} />
                      </Section>

                      {/* Notes */}
                      {selectedUser.notes && (
                        <Section title="Notes">
                          <div className="flex gap-3">
                            <FileText className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                              {selectedUser.notes}
                            </p>
                          </div>
                        </Section>
                      )}

                      {/* Assigned Vehicle */}
                      <Section title="Assigned Vehicle">
                        {selectedUser.assigned_vehicle ? (
                          <VehicleCard v={selectedUser.assigned_vehicle} highlight />
                        ) : (
                          <p className="text-sm text-zinc-400 dark:text-zinc-500 italic">No vehicle currently assigned.</p>
                        )}
                      </Section>

                      {/* Available Vehicles */}
                      {/* {(selectedUser.available_vehicles?.length ?? 0) > 0 && (
                        <Section title={`Available Vehicles (${selectedUser.available_vehicles!.length})`}>
                          <div className="space-y-2">
                            {selectedUser.available_vehicles!.map((v) => (
                              <VehicleCard key={v.id} v={v} />
                            ))}
                          </div>
                        </Section>
                      )} */}
                    </div>
                  </>
                ) : null}
              </div>

              {/* Drawer footer */}
              {selectedUser && (
                <div className="px-6 py-4 border-t border-zinc-200 dark:border-white/10 shrink-0 flex gap-3">
                  <button
                    onClick={(e) => { openEditModal(e, selectedUser); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
                  >
                    <Edit className="w-4 h-4" /> Edit Driver
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, selectedUser.id!)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Generated Code Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {createdUserCode && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-zinc-900 border border-green-500/30 p-8 rounded-3xl w-full max-w-sm shadow-[0_0_50px_rgba(34,197,94,0.2)] flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                <Key className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Driver Code Generated</h3>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-sm">Share this code with the driver so they can log in to the driver app.</p>
              <div className="bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/10 px-8 py-4 rounded-2xl w-full mb-8">
                <span className="text-4xl font-mono font-bold tracking-widest text-green-600 dark:text-green-400">{createdUserCode}</span>
              </div>
              <button
                onClick={() => setCreatedUserCode(null)}
                className="w-full bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 px-6 py-3 rounded-xl text-zinc-900 dark:text-white font-medium transition-colors"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Create / Edit Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-6 rounded-2xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white">{editingUserId ? "Edit Driver" : "Add New Driver"}</h2>
              {formError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-start space-x-2">
                  <span className="mt-0.5">⚠️</span>
                  <span>{formError}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Full Name</label>
                  <input required value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Username / Email</label>
                    <input required type="text" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Mobile Number</label>
                    <input required value={formData.mobile_number || ""} onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })} className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50" />
                  </div>
                </div>

                {/* {editingUserId && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Update Password (leave blank to keep)</label>
                    <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50" placeholder="••••••••" />
                  </div>
                )} */}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-white/10">
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Assign Vehicle</label>
                  <select value={formData.vehicle_id || ""} onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })} className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50">
                    {/* No vehicle option */}
                    <option value="">— No vehicle assigned —</option>
                    {/* Currently assigned vehicle (shown even though it's not AVAILABLE status) */}
                    {editingUserId && formData.vehicle_id && !vehicles.find((v) => v.id === formData.vehicle_id) && (
                      <option value={formData.vehicle_id}>
                        {formData._assignedVehicle
                          ? `${formData._assignedVehicle.plate_number} (${formData._assignedVehicle.make} ${formData._assignedVehicle.model}) — currently assigned`
                          : `Currently assigned vehicle`}
                      </option>
                    )}
                    {/* AVAILABLE vehicles */}
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.plate_number} ({v.make} {v.model})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Notes (Optional)</label>
                  <textarea value={formData.notes || ""} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50 h-20 resize-none" />
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-zinc-200 dark:border-white/10">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors font-medium">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl text-white font-medium transition-colors disabled:opacity-50">
                    {isSubmitting ? "Saving…" : editingUserId ? "Save Changes" : "Create Driver"}
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

// ─── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 rounded-2xl p-4 space-y-3">
      <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-zinc-400 dark:text-zinc-500 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wide mb-0.5">{label}</p>
        <div className="text-sm text-zinc-800 dark:text-zinc-200 font-medium break-words">{value}</div>
      </div>
    </div>
  );
}

function VehicleCard({ v, highlight }: { v: VehicleBasic; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
      highlight
        ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30"
        : "bg-white dark:bg-white/5 border-zinc-200 dark:border-white/10"
    }`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        highlight ? "bg-blue-100 dark:bg-blue-500/20" : "bg-zinc-100 dark:bg-white/10"
      }`}>
        <Car className={`w-4 h-4 ${highlight ? "text-blue-600 dark:text-blue-400" : "text-zinc-500 dark:text-zinc-400"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{v.make} - {v.model}</p>
        <p className="text-xs text-zinc-500">{v.plate_number}</p>
      </div>
      {v.status && (
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
          v.status === "AVAILABLE"
            ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30"
            : v.status === "ASSIGNED"
            ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30"
            : "bg-zinc-100 dark:bg-zinc-500/20 text-zinc-600 dark:text-zinc-400 border-zinc-200"
        }`}>
          {v.status}
        </span>
      )}
    </div>
  );
}
