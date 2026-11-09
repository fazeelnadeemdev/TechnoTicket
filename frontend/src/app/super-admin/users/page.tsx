"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { User, Department } from "@/lib/types";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldCheck,
  Search,
  Plus,
  Edit2,
  Trash2,
  UserPlus,
  Shield,
  Building,
  KeyRound,
  X,
  AlertCircle,
  CheckCircle2,
  RotateCcw
} from "lucide-react";

const DEPARTMENTS = [
  "Admin",
  "Maintenance",
  "Ordering",
  "Accounting",
  "IT",
  "HR",
  "RMA",
  "Escalation",
  "Management",
  "Compliance"
];

const PANEL_TYPES = ["SuperAdmin", "Manager", "Processor", "Placer"];

export default function SuperAdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [panelFilter, setPanelFilter] = useState("All Panels");
  const [deptFilter, setDeptFilter] = useState("All Departments");

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "Processor",
    panel_type: "Processor",
    department: "Admin",
    departments: ["Admin"] as string[],
    team_type: "Internal",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (panelFilter !== "All Panels") params.append("panel_type", panelFilter);
      if (deptFilter !== "All Departments") params.append("department", deptFilter);

      const data = await apiFetch<User[]>(`/api/users?${params.toString()}`);
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  }, [search, panelFilter, deptFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "password123",
      role: "Processor",
      panel_type: "Processor",
      department: "Admin",
      departments: ["Admin"],
      team_type: "Internal",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      phone: u.phone || "",
      password: "",
      role: u.role,
      panel_type: u.panel_type || "Processor",
      department: u.department,
      departments: u.departments && u.departments.length > 0 ? u.departments : [u.department],
      team_type: u.team_type || "Internal",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleToggleDept = (d: string) => {
    if (d === "All") {
      if (formData.departments.includes("All")) {
        setFormData({ ...formData, departments: [formData.department] });
      } else {
        setFormData({ ...formData, departments: ["All", ...DEPARTMENTS] });
      }
      return;
    }

    const current = [...formData.departments];
    const index = current.indexOf(d);
    if (index > -1) {
      if (current.length > 1) {
        current.splice(index, 1);
      }
    } else {
      current.push(d);
    }
    setFormData({ ...formData, departments: current });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError("Name and Email are required.");
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      setFormError("Password is required for new user.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        await apiFetch(`/api/users/${editingUser.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim() || null,
            role: formData.role,
            panel_type: formData.panel_type,
            department: formData.department,
            departments: formData.departments,
            team_type: formData.team_type,
            password: formData.password.trim() ? formData.password.trim() : undefined,
          }),
        });
      } else {
        await apiFetch("/api/users", {
          method: "POST",
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim() || null,
            password: formData.password.trim(),
            role: formData.role,
            panel_type: formData.panel_type,
            department: formData.department,
            departments: formData.departments,
            team_type: formData.team_type,
          }),
        });
      }

      setModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || "Failed to save user credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (!confirm(`Are you sure you want to permanently delete user '${u.name}' (${u.email})?`)) {
      return;
    }

    try {
      await apiFetch(`/api/users/${u.id}`, { method: "DELETE" });
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Failed to delete user.");
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center space-x-2 text-purple-900 mb-1">
              <ShieldCheck className="w-6 h-6 text-purple-700" />
              <h1 className="text-xl font-bold tracking-tight">User & Access Control</h1>
            </div>
            <p className="text-xs text-slate-500">
              Manage multi-department roles, 4-panel user types, and team permissions for Techno Communications LLC.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-800 hover:bg-purple-900 text-white text-xs font-bold shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>CREATE NEW USER</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={panelFilter}
              onChange={(e) => setPanelFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
            >
              <option value="All Panels">All Panels</option>
              {PANEL_TYPES.map((p) => (
                <option key={p} value={p}>
                  {p} Panel
                </option>
              ))}
            </select>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
            >
              <option value="All Departments">All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d} Department
                </option>
              ))}
            </select>

            {(search || panelFilter !== "All Panels" || deptFilter !== "All Departments") && (
              <button
                onClick={() => {
                  setSearch("");
                  setPanelFilter("All Panels");
                  setDeptFilter("All Departments");
                }}
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100"
                title="Reset Filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">4-Panel Role</th>
                  <th className="py-3.5 px-4">Primary Dept</th>
                  <th className="py-3.5 px-4">Granted Departments</th>
                  <th className="py-3.5 px-4">Team</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      Loading user accounts...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      No user accounts found matching current query.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSuper = u.role === "SuperAdmin" || u.panel_type === "SuperAdmin";
                    const isManager = u.panel_type === "Manager" || u.role === "Manager";
                    const isProcessor = u.panel_type === "Processor" || u.role === "Processor";
                    const isPlacer = u.panel_type === "Placer" || u.role === "Placer";

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[11px] text-slate-500">{u.email}</div>
                          {u.phone && <div className="text-[10px] text-slate-400 font-mono">{u.phone}</div>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isSuper
                                ? "bg-purple-100 text-purple-900 border border-purple-300"
                                : isManager
                                ? "bg-blue-100 text-blue-900 border border-blue-300"
                                : isProcessor
                                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                : "bg-amber-100 text-amber-900 border border-amber-300"
                            }`}
                          >
                            {u.panel_type || u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {u.department}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {u.departments && u.departments.includes("All") ? (
                              <span className="px-2 py-0.5 rounded bg-purple-800 text-white text-[10px] font-bold">
                                All Departments (Super Access)
                              </span>
                            ) : (
                              (u.departments && u.departments.length > 0 ? u.departments : [u.department]).map((d) => (
                                <span
                                  key={d}
                                  className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200"
                                >
                                  {d}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              u.team_type === "Internal"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-orange-50 text-orange-700 border border-orange-200"
                            }`}
                          >
                            {u.team_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openEditModal(u)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                              title="Edit user access"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {currentUser?.id !== u.id && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create / Edit User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-900 to-purple-800 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-purple-300" />
                <h2 className="text-base font-bold">
                  {editingUser ? `Edit Access: ${editingUser.name}` : "Create New User Credentials"}
                </h2>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs max-h-[85vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Haseeb Siddiqui"
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Corporate Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@techno-communications.com"
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(602) 555-0199"
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {editingUser ? "Reset Password (leave blank to keep)" : "Password *"}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? "••••••••" : "Temporary password"}
                    className="w-full rounded-xl border border-slate-200 p-2.5 font-medium"
                    required={!editingUser}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">4-Panel Role *</label>
                  <select
                    value={formData.panel_type}
                    onChange={(e) => setFormData({ ...formData, panel_type: e.target.value, role: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
                  >
                    {PANEL_TYPES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Primary Dept *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => {
                      const newDept = e.target.value;
                      const currentDepts = formData.departments.includes(newDept)
                        ? formData.departments
                        : [...formData.departments, newDept];
                      setFormData({ ...formData, department: newDept, departments: currentDepts });
                    }}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Team Type</label>
                  <select
                    value={formData.team_type}
                    onChange={(e) => setFormData({ ...formData, team_type: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
                  >
                    <option value="Internal">Internal</option>
                    <option value="External">External</option>
                  </select>
                </div>
              </div>

              {/* Multi-Department Permissions */}
              <div className="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-950 uppercase text-[11px]">
                    Multi-Department Operational Access
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleDept("All")}
                    className="text-[10px] text-purple-700 font-bold hover:underline"
                  >
                    {formData.departments.includes("All") ? "Deselect All" : "Grant All Departments"}
                  </button>
                </div>
                <p className="text-[10px] text-purple-800">
                  Select which departments this user can switch into upon login:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {DEPARTMENTS.map((dept) => {
                    const isChecked =
                      formData.departments.includes("All") || formData.departments.includes(dept);
                    return (
                      <label
                        key={dept}
                        className={`flex items-center space-x-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? "bg-white border-purple-500 font-bold text-purple-900 shadow-xs"
                            : "bg-purple-100/30 border-purple-100 text-slate-600 hover:bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleDept(dept)}
                          className="rounded text-purple-700 focus:ring-purple-600"
                        />
                        <span className="truncate">{dept}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-bold shadow-md hover:shadow-lg transition-all"
                >
                  {submitting ? "Saving..." : editingUser ? "Update User Access" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

