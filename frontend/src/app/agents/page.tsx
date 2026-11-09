"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SolverUser } from "@/lib/types";
import { apiFetch } from "@/lib/api";
import { Users, Mail, Phone, Shield, Wrench, Search, Building2, CheckCircle2 } from "lucide-react";

export default function AgentsPage() {
  const [solvers, setSolvers] = useState<SolverUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState<"All" | "Internal" | "External">("All");

  useEffect(() => {
    const fetchSolvers = async () => {
      setLoading(true);
      try {
        const data = await apiFetch<SolverUser[]>("/api/users/solvers");
        setSolvers(data);
      } catch (err) {
        console.error("Failed to load solvers", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSolvers();
  }, []);

  const filtered = solvers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase());
    const matchesTeam = teamFilter === "All" || s.team_type === teamFilter;
    return matchesSearch && matchesTeam;
  });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-700" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Agents & Solvers Directory</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Field Technicians, Internal Handymen & External Contractors ({solvers.length} active agents)
            </p>
          </div>

          {/* Search & Team Filter */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 font-semibold">
              {(["All", "Internal", "External"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTeamFilter(t)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    teamFilter === t
                      ? "bg-purple-800 text-white shadow-sm font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search agent name or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 pl-8 p-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>
        </div>

        {/* Agents Grid */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <div className="inline-block w-6 h-6 border-2 border-purple-300 border-t-purple-700 rounded-full animate-spin mb-2" />
            <div>Loading agent directory...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            No agents found matching your query.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((agent) => (
              <div
                key={agent.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center font-bold text-purple-800 text-sm">
                        {agent.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{agent.name}</h3>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              agent.team_type === "Internal"
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : "bg-blue-100 text-blue-800 border border-blue-200"
                            }`}
                          >
                            {agent.team_type} Team
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            • {agent.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 flex items-center space-x-1.5">
                        <Building2 className="w-3.5 h-3.5 text-purple-600" />
                        <span>Department:</span>
                      </span>
                      <span className="font-semibold text-slate-800">{agent.department}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 flex items-center space-x-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>Email:</span>
                      </span>
                      <a
                        href={`mailto:${agent.email}`}
                        className="font-medium text-purple-700 hover:underline truncate max-w-[170px]"
                      >
                        {agent.email}
                      </a>
                    </div>

                    {agent.phone && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-400 flex items-center space-x-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>Phone:</span>
                        </span>
                        <span className="font-medium text-slate-700">{agent.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Current Assigned Workload:</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      agent.active_tickets_count > 0
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {agent.active_tickets_count} Active Tickets
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

