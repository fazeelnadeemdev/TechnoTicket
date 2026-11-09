"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Shield, Lock, Mail, Building, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

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

const DEMO_ACCOUNTS = [
  { name: "Amad Hussain", email: "amad@techno-communications.com", role: "Admin", dept: "Admin" },
  { name: "Nur Rahman", email: "nur@techno-communications.com", role: "MM", dept: "Management" },
  { name: "Syed Faizan", email: "faizan@techno-communications.com", role: "Compliance", dept: "Compliance" },
  { name: "Maqadam Mustfa", email: "maqadam@techno-communications.com", role: "Solver (Internal)", dept: "Maintenance" },
  { name: "Saunders Tech", email: "saunders@external-tech.com", role: "Solver (External)", dept: "Maintenance" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("amad@techno-communications.com");
  const [password, setPassword] = useState("password123");
  const [departmentContext, setDepartmentContext] = useState("Admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password, departmentContext);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = (demo: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(demo.email);
    setPassword("password123");
    setDepartmentContext(demo.dept);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      {/* Container */}
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-purple-100 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Banner */}
        <div className="bg-gradient-to-r from-purple-900 to-purple-800 p-8 text-center text-white relative">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-2xl text-purple-200 mx-auto mb-3 shadow-inner">
            TC
          </div>
          <h1 className="text-xl font-bold tracking-tight">Techno Communications LLC</h1>
          <p className="text-xs text-purple-200 mt-1 font-medium">
            Metro by T-Mobile Authorized Retailer Network
          </p>
          <div className="mt-3 inline-flex items-center space-x-1.5 bg-purple-950/60 text-purple-200 px-3 py-1 rounded-full text-[11px] font-semibold border border-purple-700/50">
            <Shield className="w-3.5 h-3.5 text-purple-300" />
            <span>Internal Ticketing Portal</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@techno-communications.com"
                  className="w-full text-xs rounded-xl border border-slate-200 pl-9 p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs rounded-xl border border-slate-200 pl-9 p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium transition-colors"
                  required
                />
              </div>
            </div>

            {/* Department Context Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department Context
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={departmentContext}
                  onChange={(e) => setDepartmentContext(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 pl-9 p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium transition-colors"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept} Department
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Scopes your default operational dashboard while allowing cross-department ticket creation.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
            >
              <span>{loading ? "Authenticating..." : "Sign In to Portal"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Quick 1-Click Demo Profiles
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {DEMO_ACCOUNTS.map((demo) => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => selectDemoAccount(demo)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors flex items-center space-x-1 ${
                    email === demo.email
                      ? "bg-purple-100 text-purple-900 border-purple-400 font-bold"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>{demo.name}</span>
                  <span className="text-slate-400">({demo.role})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

