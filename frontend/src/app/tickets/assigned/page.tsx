"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { Ticket } from "@/lib/types";
import { apiFetch } from "@/lib/api";
import {
  Search,
  RotateCcw,
  UserCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Plus
} from "lucide-react";
import { TicketDetailModal } from "@/components/modals/TicketDetailModal";
import { CreateTicketModal } from "@/components/modals/CreateTicketModal";

const PRIORITIES = ["All Priorities", "Low", "Medium", "High"];

export default function AssignedTicketsPage() {
  const { user } = useAuth();

  // Toggle filter: 'Total' (all assigned tickets in system), 'Assigned To Me', 'Assigned By Me'
  const [assignScope, setAssignScope] = useState<"Total" | "Assigned To Me" | "Assigned By Me">("Assigned To Me");
  const [selectedPriority, setSelectedPriority] = useState("All Priorities");
  const [searchQuery, setSearchQuery] = useState("");

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchAssignedTickets = useCallback(async () => {
    setLoading(true);
    try {
      let scopeParam = "all";
      let assignedToParam = "";

      if (assignScope === "Assigned To Me") {
        scopeParam = "assigned_to_me";
      } else if (assignScope === "Assigned By Me") {
        scopeParam = "assigned_by_me";
      }

      const params = new URLSearchParams({
        scope: scopeParam,
        priority: selectedPriority === "All Priorities" ? "" : selectedPriority,
        search: searchQuery.trim(),
        limit: "200",
      });

      const data = await apiFetch<Ticket[]>(`/api/tickets?${params.toString()}`);
      // If 'Total' mode, filter to only tickets where assigned_to_name is not empty
      if (assignScope === "Total") {
        setTickets(data.filter((t) => t.assigned_to_name || t.assigned_to_id));
      } else {
        setTickets(data);
      }
    } catch (err) {
      console.error("Failed to load assigned tickets", err);
    } finally {
      setLoading(false);
    }
  }, [assignScope, selectedPriority, searchQuery]);

  useEffect(() => {
    fetchAssignedTickets();
  }, [fetchAssignedTickets]);

  const handleResetFilters = () => {
    setAssignScope("Assigned To Me");
    setSelectedPriority("All Priorities");
    setSearchQuery("");
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setDetailModalOpen(true);
  };

  const handleTicketUpdated = (updated: Ticket) => {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTicket(updated);
  };

  const getPriorityBadge = (p: string) => {
    switch (p.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s.toLowerCase()) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "assigned":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "open":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "completed":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      case "close":
        return "bg-slate-200 text-slate-800 border-slate-300";
      case "hold":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "re-open":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-purple-700" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Assigned By (or) Assigned To You
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Field Technician & Management Assignment Directory ({tickets.length} tickets)
            </p>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-800 hover:bg-purple-900 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE NEW TICKET</span>
          </button>
        </div>

        {/* Filter Bar with Segmented Toggle */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Segmented Toggle: Total / Assigned To Me / Assigned By Me */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 font-semibold">
            {(["Total", "Assigned To Me", "Assigned By Me"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setAssignScope(tab)}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  assignScope === tab
                    ? "bg-purple-800 text-white shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Priority */}
            <div>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="rounded-xl border border-slate-200 p-2 text-xs bg-slate-50 focus:bg-white font-medium"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search assigned tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 pl-8 p-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            {/* Reset */}
            <button
              onClick={handleResetFilters}
              className="flex items-center space-x-1.5 p-2 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3.5">Ticket ID</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Client Name</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-4 min-w-[220px]">Description</th>
                  <th className="py-3 px-3">Market</th>
                  <th className="py-3 px-3 min-w-[140px]">Store / House</th>
                  <th className="py-3 px-3">Assigned To</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                      <div className="inline-block w-6 h-6 border-2 border-purple-300 border-t-purple-700 rounded-full animate-spin mb-2" />
                      <div>Loading assigned tickets...</div>
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                      No assigned tickets found in &quot;{assignScope}&quot; view.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => handleTicketClick(t)}
                      className="hover:bg-purple-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3.5 font-mono font-bold text-purple-900 group-hover:text-purple-700">
                        {t.ticket_code}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] border ${getPriorityBadge(
                            t.priority
                          )}`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        {t.creator_name}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] border ${getStatusBadge(
                            t.status
                          )}`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        {t.category}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={t.description}>
                        {t.description}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        {t.market}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              t.location_type === "Store" ? "bg-orange-500" : "bg-emerald-500"
                            }`}
                          />
                          <span className="truncate max-w-[150px] font-medium text-slate-700">
                            {t.location_display.replace(/^(Store:|House:)\s*/, "")}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-semibold text-purple-900">
                          {t.assigned_to_name || "Unassigned"}
                        </span>
                        {t.solved_by_team && (
                          <span className="ml-1.5 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {t.solved_by_team}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTicketClick(t);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-100/60"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {detailModalOpen && (
        <TicketDetailModal
          ticket={selectedTicket}
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          onTicketUpdated={handleTicketUpdated}
        />
      )}

      {createModalOpen && (
        <CreateTicketModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            fetchAssignedTickets();
          }}
        />
      )}
    </AppShell>
  );
}

