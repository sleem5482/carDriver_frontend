"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Loader2, Key, Edit, Trash2 } from "lucide-react";
import api from "../../../lib/api";

type Vehicle = {
  id: string;
  plate_number: string;
  make: string;
  model: string;
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
  assigned_vehicle?: Vehicle | null;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create / Update Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  const [createdUserCode, setCreatedUserCode] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<User> & { password?: string, vehicle_id?: string }>({
    full_name: "",
    mobile_number: "",
    email: "",
    role: "DRIVER",
    status: "ACTIVE",
    notes: "",
    password: "",
    vehicle_id: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchVehicles();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await api.get("/admin/vehicles/");
      setVehicles(res.data);
    } catch (err) {
      console.error("Failed to fetch vehicles", err);
    }
  };

  const openCreateModal = () => {
    setEditingUserId(null);
    setFormError(null);
    setFormData({
      full_name: "",
      mobile_number: "",
      email: "",
      role: "DRIVER",
      status: "ACTIVE",
      notes: "",
      password: "",
      vehicle_id: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUserId(user.id!);
    setFormError(null);
    setFormData({
      full_name: user.full_name,
      mobile_number: user.mobile_number,
      email: user.email,
      role: user.role,
      status: user.status,
      notes: user.notes,
      password: "", // blank to not update password unless typed
      vehicle_id: user.assigned_vehicle?.id || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
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
    
    // Build payload matching the API spec
    const payload: Record<string, unknown> = {
      full_name: formData.full_name,
      mobile_number: formData.mobile_number,
      email: formData.email,
      role: formData.role,
      status: formData.status,
      notes: formData.notes || "",
    };

    // Only include vehicle_id if one is selected
    if (formData.vehicle_id) payload.vehicle_id = formData.vehicle_id;

    // For edits: optionally update password
    if (editingUserId) {
      if (formData.password) payload.password = formData.password;
    }

    try {
      if (editingUserId) {
        await api.put(`/admin/users/${editingUserId}`, payload);
      } else {
        const res = await api.post("/admin/users", payload);
        if (res.data?.generated_code) {
          setCreatedUserCode(res.data.generated_code);
        }
      }
      
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      console.error("Failed to save user", err);
      // Extract the real error message from the server response
      let message = "An unexpected error occurred. Please try again.";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { status?: number; data?: { detail?: unknown; message?: string } } };
        const status = axiosErr.response?.status;
        const detail = axiosErr.response?.data?.detail;
        const serverMessage = axiosErr.response?.data?.message;
        if (status === 409) {
          message = (typeof detail === "string" ? detail : null) || serverMessage || "A user with this email or mobile number already exists.";
        } else if (status === 422) {
          // FastAPI returns detail as an array of validation error objects
          if (Array.isArray(detail)) {
            message = detail.map((e: { loc?: string[]; msg?: string }) => {
              const field = e.loc ? e.loc.filter(l => l !== "body").join(" → ") : "";
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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-white">Users & Drivers</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Manage drivers, admins, and vehicle assignments</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add User</span>
        </button>
      </div>

      {/* List */}
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
                  <th className="py-4 px-6 font-medium">Role</th>
                  <th className="py-4 px-6 font-medium">Assigned Vehicle</th>
                  <th className="py-4 px-6 font-medium">Status</th>
                  <th className="py-4 px-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={i} className="border-b border-zinc-100 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 font-medium text-zinc-900 dark:text-white">{u.full_name}</td>
                    <td className="py-4 px-6 text-zinc-600 dark:text-zinc-300">
                      <div className="flex flex-col">
                        <span>{u.email}</span>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">{u.mobile_number}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {u.assigned_vehicle ? (
                        <div className="flex flex-col">
                          <span className="text-zinc-900 dark:text-white text-sm">{u.assigned_vehicle.plate_number}</span>
                          <span className="text-xs text-zinc-500">{u.assigned_vehicle.make} {u.assigned_vehicle.model}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-500 text-xs italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        u.status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30' : 
                        'bg-zinc-100 dark:bg-zinc-500/20 text-zinc-700 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-500/30'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button onClick={() => openEditModal(u)} className="p-2 text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(u.id!)} className="p-2 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Code Modal */}
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
              <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-sm">Please share this code with the driver. They will need it to log in to the driver app.</p>
              
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

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-6 rounded-2xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white">{editingUserId ? 'Edit User' : 'Add New User'}</h2>
              {/* Inline error banner */}
              {formError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-start space-x-2">
                  <span className="mt-0.5">⚠️</span>
                  <span>{formError}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Full Name</label>
                  <input
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Username / Email</label>
                    <input
                      required
                      type="text"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Mobile Number</label>
                    <input
                      required
                      value={formData.mobile_number || ""}
                      onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>
                
                {editingUserId && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Update Password (Leave blank to keep)</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50"
                    >
                      <option value="DRIVER">DRIVER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-white/10">
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Assign Vehicle</label>
                  <select
                    value={formData.vehicle_id || ""}
                    onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})}
                    className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="">-- No Vehicle Assigned --</option>
                    {/* Currently assigned vehicle (may not be in available list) */}
                    {editingUserId && formData.vehicle_id && !vehicles.find(v => v.id === formData.vehicle_id) && (
                      <option value={formData.vehicle_id}>
                        {users.find(u => u.id === editingUserId)?.assigned_vehicle?.plate_number ?? "Current Vehicle"}
                        {" (currently assigned)"}
                      </option>
                    )}
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.plate_number} ({v.make} {v.model})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Notes (Optional)</label>
                  <textarea
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50 h-20 resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-zinc-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl text-white font-medium transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : editingUserId ? "Save Changes" : "Create User"}
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
