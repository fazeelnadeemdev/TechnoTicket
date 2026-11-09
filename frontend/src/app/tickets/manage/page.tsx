"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { Ticket, SolverUser } from "@/lib/types";
import { apiFetch } from "@/lib/api";
import {
  Search,
  Filter,
  Download,
  RotateCcw,
  Plus,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  Shield,
  Building
} from "lucide-react";
import { TicketDetailModal } from "@/components/modals/TicketDetailModal";
import { CreateTicketModal } from "@/components/modals/CreateTicketModal";
import { ExportTicketsModal } from "@/components/modals/ExportTicketsModal";

const MARKETS = [
  "All Markets", "Arizona", "Houston", "Bay Area", "Memphis", "Philly", "Utah", "Miami", "El Paso", "Arkansas"
];

const STATUSES = [
  "All Statuses", "Pending", "Assigned", "Open", "Completed", "Close", "Hold", "Re-Open"
];

const DEPARTMENTS = [
  "All Departments", "Admin", "Maintenance", "Ordering", "Accounting", "IT", "HR", "RMA", "Escalation", "Management", "Compliance"
];

export default function ManageTicketsPage() {
  const { user, activeDepartment } = useAuth();

  // Filters
  const [dateMode, setDateMode] = useState<"created" | "updated">("created");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [selectedDept, setSelectedDept] = useState<string>("All Departments");
  const [selectedMarket, setSelectedMarket] = useState("All Markets");
  const [selectedSolver, setSelectedSolver] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Data & Pagination
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [solvers, setSolvers] = useState<SolverUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Modals
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Set initial department from activeDepartment context
  useEffect(() => {
    if (activeDepartment && activeDepartment !== "Admin") {
      setSelectedDept(activeDepartment);
    } else {
      setSelectedDept("All Departments");
    }
  }, [activeDepartment]);

  // Load solvers
  useEffect(() => {
    const fetchSolvers = async () => {
      try {
        const data = await apiFetch<SolverUser[]>("/api/users/solvers");
        setSolvers(data);
      } catch (err) {
        console.error("Failed to load solvers", err);
      }
    };
    fetchSolvers();
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        scope: "all",
        date_mode: dateMode,
        status: selectedStatus === "All Statuses" ? "" : selectedStatus,
        department: selectedDept === "All Departments" ? "" : selectedDept,
        market: selectedMarket === "All Markets" ? "" : selectedMarket,
        assigned_to_id: selectedSolver || "",
        search: searchQuery.trim(),
        date_from: dateFrom ? new Date(dateFrom).toISOString() : "",
        date_to: dateTo ? new Date(dateTo).toISOString() : "",
        limit: "200",
      });

      const data = await apiFetch<Ticket[]>(`/api/tickets?${params.toString()}`);
      setTickets(data);
    } catch (err) {
      console.error("Failed to load tickets", err);
    } finally {
      setLoading(false);
    }
  }, [dateMode, selectedStatus, selectedDept, selectedMarket, selectedSolver, searchQuery, dateFrom, dateTo]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Global ticket created listener
  useEffect(() => {
    const handleTicketCreated = () => fetchTickets();
    window.addEventListener("techno:ticket-created", handleTicketCreated);
    return () => window.removeEventListener("techno:ticket-created", handleTicketCreated);
  }, [fetchTickets]);

  const handleResetFilters = () => {
    setDateMode("created");
    setDateFrom("");
    setDateTo("");
    setSelectedStatus("All Statuses");
    setSelectedDept("All Departments");
    setSelectedMarket("All Markets");
    setSelectedSolver("");
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

  // Pagination slice
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
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manage Tickets</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive Operations Center • Techno Communications LLC
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setExportModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-purple-700" />
              <span>EXPORT TICKETS</span>
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-800 hover:bg-purple-900 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>CREATE NEW TICKET</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3.5 text-xs">
          {/* Top row: Mode toggle + Dates + Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            {/* Created vs Updated toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDateMode("created")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateMode === "created"
                    ? "bg-purple-800 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Created Date
              </button>
              <button
                type="button"
                onClick={() => setDateMode("updated")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateMode === "updated"
                    ? "bg-purple-800 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Last Updated
              </button>
            </div>

            {/* Date Pickers */}
            <div className="flex items-center space-x-2">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase mr-1">From:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded-lg border border-slate-200 p-1.5 text-xs bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase mr-1">To:</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded-lg border border-slate-200 p-1.5 text-xs bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={handleResetFilters}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          </div>

          {/* Bottom row: Status, Department, Market, Solver, Search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
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

            {/* Department */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Department</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
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

            {/* Solver */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Solver / Agent</label>
              <select
                value={selectedSolver}
                onChange={(e) => setSelectedSolver(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
              >
                <option value="">All Solvers</option>
                {solvers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.team_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Search anything... */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Search Anything...</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Ticket#, keyword, tech ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 pl-8 p-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Data Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3.5">Ticket ID</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Creator Name</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-4 min-w-[200px]">Description</th>
                  <th className="py-3 px-3">Market</th>
                  <th className="py-3 px-3 min-w-[140px]">Store / House</th>
                  <th className="py-3 px-3">Solved Team</th>
                  <th className="py-3 px-3">Solved By</th>
                  <th className="py-3 px-3">Open Ticket</th>
                  <th className="py-3 px-3">Closed Ticket</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-slate-400 font-medium">
                      <div className="inline-block w-6 h-6 border-2 border-purple-300 border-t-purple-700 rounded-full animate-spin mb-2" />
                      <div>Loading tickets...</div>
                    </td>
                  </tr>
                ) : currentRows.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-slate-400 font-medium">
                      No tickets found matching the specified filters.
                    </td>
                  </tr>
                ) : (
                  currentRows.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => handleTicketClick(t)}
                      className="hover:bg-purple-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Ticket ID */}
                      <td className="py-3 px-3.5 font-mono font-bold text-purple-900 group-hover:text-purple-700">
                        {t.ticket_code}
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] border ${getPriorityBadge(
                            t.priority
                          )}`}
                        >
                          {t.priority}
                        </span>
                      </td>

                      {/* Creator */}
                      <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        {t.creator_name}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] border ${getStatusBadge(
                            t.status
                          )}`}
                        >
                          {t.status}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                        {t.department}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={t.description}>
                        {t.description}
                      </td>

                      {/* Market */}
                      <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        {t.market}
                      </td>

                      {/* Store / House with color dot */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5" title={t.location_display}>
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

                      {/* Solved Team */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {t.solved_by_team ? (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              t.solved_by_team === "Internal"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {t.solved_by_team}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Solved By */}
                      <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                        {t.solved_by_name || <span className="text-slate-300">Unassigned</span>}
                      </td>

                      {/* Open Ticket Duration */}
                      <td className="py-3 px-3 font-semibold text-purple-900 whitespace-nowrap">
                        {t.open_duration_days}
                      </td>

                      {/* Closed Ticket Duration */}
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

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTicketClick(t);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-100/60 transition-colors"
                          title="View Ticket Details"
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

          {/* Pagination Bar */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center space-x-2">
              <span>Showing</span>
              <span className="font-bold text-slate-800">
                {tickets.length === 0 ? 0 : indexOfFirstRow + 1}
              </span>
              <span>to</span>
              <span className="font-bold text-slate-800">
                {Math.min(indexOfLastRow, tickets.length)}
              </span>
              <span>of</span>
              <span className="font-bold text-slate-800">{tickets.length}</span>
              <span>tickets</span>
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
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-bold text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
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
            fetchTickets();
          }}
        />
      )}

      {exportModalOpen && (
        <ExportTicketsModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          currentFilters={{
            status: selectedStatus === "All Statuses" ? "" : selectedStatus,
            department: selectedDept === "All Departments" ? "" : selectedDept,
            market: selectedMarket === "All Markets" ? "" : selectedMarket,
            search: searchQuery,
          }}
        />
      )}
    </AppShell>
  );
}

