"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { Ticket } from "@/lib/types";
import { apiFetch } from "@/lib/api";
import {
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Eye,
  RotateCcw,
  UserCheck,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { TicketDetailModal } from "@/components/modals/TicketDetailModal";
import { CreateTicketModal } from "@/components/modals/CreateTicketModal";

const MARKETS = [
  "All Markets", "Arizona", "Houston", "Bay Area", "Memphis", "Philly", "Utah", "Miami", "El Paso", "Arkansas"
];

const STATUSES = [
  "All Statuses", "Pending", "Assigned", "Open", "Completed", "Close", "Hold", "Re-Open"
];

const PRIORITIES = ["All Priorities", "Low", "Medium", "High"];

export default function OwnTicketsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [selectedPriority, setSelectedPriority] = useState("All Priorities");
  const [selectedMarket, setSelectedMarket] = useState("All Markets");
  const [searchQuery, setSearchQuery] = useState("");

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchOwnTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        scope: "own",
        status: selectedStatus === "All Statuses" ? "" : selectedStatus,
        priority: selectedPriority === "All Priorities" ? "" : selectedPriority,
        market: selectedMarket === "All Markets" ? "" : selectedMarket,
        search: searchQuery.trim(),
        limit: "200",
      });

      const data = await apiFetch<Ticket[]>(`/api/tickets?${params.toString()}`);
      setTickets(data);
    } catch (err) {
      console.error("Failed to load personal tickets", err);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedPriority, selectedMarket, searchQuery]);

  useEffect(() => {
    fetchOwnTickets();
  }, [fetchOwnTickets]);

  const handleResetFilters = () => {
    setSelectedStatus("All Statuses");
    setSelectedPriority("All Priorities");
    setSelectedMarket("All Markets");
    setSearchQuery("");
  };

  const handleTicketClick = (ticket: Ticket) => {
    router.push(`/tickets/${ticket.id}`);
  };

  const handleTicketUpdated = (updated: Ticket) => {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTicket(updated);
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = tickets.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(tickets.length / rowsPerPage) || 1;

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
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Own Tickets</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Personal Tickets Created by {user?.name || "You"} ({tickets.length} total)
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

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs items-end">
          {/* Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Market */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Market</label>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
            >
              {MARKETS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search description, ticket#..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 pl-8 p-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>

          {/* Reset */}
          <div>
            <button
              onClick={handleResetFilters}
              className="w-full flex items-center justify-center space-x-1.5 p-2 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
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
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-4 min-w-[220px]">Description</th>
                  <th className="py-3 px-3">Market</th>
                  <th className="py-3 px-3 min-w-[140px]">Store / House</th>
                  <th className="py-3 px-3">Assigned Solver</th>
                  <th className="py-3 px-3">Open Ticket</th>
                  <th className="py-3 px-3">Closed Ticket</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400 font-medium">
                      <div className="inline-block w-6 h-6 border-2 border-purple-300 border-t-purple-700 rounded-full animate-spin mb-2" />
                      <div>Loading your personal tickets...</div>
                    </td>
                  </tr>
                ) : currentRows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400 font-medium">
                      You have not created any tickets matching these filters.
                    </td>
                  </tr>
                ) : (
                  currentRows.map((t) => (
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
                      <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                        {t.department}
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
                      <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                        {t.assigned_to_name || <span className="text-slate-300">Unassigned</span>}
                      </td>
                      <td className="py-3 px-3 font-semibold text-purple-900 whitespace-nowrap">
                        {t.open_duration_days}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {t.status.toLowerCase() === "close" ? (
                          <span className="flex items-center space-x-1 text-emerald-700 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{t.closed_duration_days}</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 text-slate-400 text-[11px]">
                            <XCircle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                            <span>Not closed</span>
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

          {/* Pagination */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing <span className="font-bold text-slate-800">{tickets.length === 0 ? 0 : indexOfFirstRow + 1}</span> to{" "}
              <span className="font-bold text-slate-800">{Math.min(indexOfLastRow, tickets.length)}</span> of{" "}
              <span className="font-bold text-slate-800">{tickets.length}</span> personal tickets
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5">
                <span>Rows:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-slate-200 p-1 bg-white font-medium"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-bold text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
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
            fetchOwnTickets();
          }}
        />
      )}
    </AppShell>
  );
}

