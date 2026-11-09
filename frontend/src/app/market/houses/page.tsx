"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { House } from "@/lib/types";
import { apiFetch } from "@/lib/api";
import {
  Home,
  Search,
  Filter,
  MapPin,
  Calendar,
  User,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCcw
} from "lucide-react";

export default function HousesPage() {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [marketFilter, setMarketFilter] = useState("All Markets");
  const [search, setSearch] = useState("");
  const [markets, setMarkets] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Fetch unique markets
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const m = await apiFetch<string[]>("/api/tickets/markets");
        setMarkets(m);
      } catch (err) {
        console.error("Failed to load markets", err);
      }
    };
    fetchMarkets();
  }, []);

  const fetchHouses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter === "All Statuses" ? "" : statusFilter,
        market: marketFilter === "All Markets" ? "" : marketFilter,
        search: search.trim(),
      });
      const data = await apiFetch<House[]>(`/api/houses?${params.toString()}`);
      setHouses(data);
    } catch (err) {
      console.error("Failed to load houses", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, marketFilter, search]);

  useEffect(() => {
    fetchHouses();
    setCurrentPage(1);
  }, [fetchHouses]);

  const handleReset = () => {
    setStatusFilter("All Statuses");
    setMarketFilter("All Markets");
    setSearch("");
  };

  // Pagination slice
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = houses.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(houses.length / rowsPerPage) || 1;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Home className="w-5 h-5 text-purple-700" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Houses & Accommodations</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Corporate Housing & Market Home Rentals ({houses.length} accommodations recorded)
            </p>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 p-2 bg-slate-50 focus:bg-white font-medium"
              >
                <option value="All Statuses">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Market Filter */}
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-500">Market:</span>
              <select
                value={marketFilter}
                onChange={(e) => setMarketFilter(e.target.value)}
                className="rounded-xl border border-slate-200 p-2 bg-slate-50 focus:bg-white font-medium max-w-[180px]"
              >
                <option value="All Markets">All Markets</option>
                {markets.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="flex items-center space-x-1 p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search code, address, lease holder..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 pl-8 p-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3.5">Code</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Market</th>
                  <th className="py-3 px-4 min-w-[240px]">Address</th>
                  <th className="py-3 px-3 min-w-[180px]">Lease Holders</th>
                  <th className="py-3 px-3">MM / DM</th>
                  <th className="py-3 px-3">Monthly Rent</th>
                  <th className="py-3 px-3">Payment Mode</th>
                  <th className="py-3 px-3">Lease End Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      <div className="inline-block w-6 h-6 border-2 border-purple-300 border-t-purple-700 rounded-full animate-spin mb-2" />
                      <div>Loading corporate houses...</div>
                    </td>
                  </tr>
                ) : currentRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      No corporate accommodations found matching filters.
                    </td>
                  </tr>
                ) : (
                  currentRows.map((h) => {
                    const isActive = h.status.toLowerCase() === "active";
                    return (
                      <tr key={h.id} className="hover:bg-purple-50/30 transition-colors">
                        {/* Code */}
                        <td className="py-3 px-3.5 font-mono font-bold text-purple-900 whitespace-nowrap">
                          {h.house_code || "—"}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                              isActive
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                            />
                            <span>{h.status}</span>
                          </span>
                        </td>

                        {/* Market */}
                        <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                          {h.market}
                        </td>

                        {/* Address */}
                        <td className="py-3 px-4 text-slate-700">
                          <div className="flex items-center space-x-1.5">
                            <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>{h.address}</span>
                          </div>
                        </td>

                        {/* Lease Holders */}
                        <td className="py-3 px-3 text-slate-600">
                          {h.lease_holders || <span className="text-slate-300">—</span>}
                        </td>

                        {/* MM/DM */}
                        <td className="py-3 px-3 font-medium text-slate-800 whitespace-nowrap">
                          {h.mm_dm || <span className="text-slate-300">—</span>}
                        </td>

                        {/* Monthly Rent */}
                        <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                          {h.monthly_rent ? `$${h.monthly_rent}` : "—"}
                        </td>

                        {/* Mode of Payment */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {h.mode_of_payment ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {h.mode_of_payment}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Lease End Date */}
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {h.lease_end_date ? (
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{h.lease_end_date}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing <span className="font-bold text-slate-800">{houses.length === 0 ? 0 : indexOfFirstRow + 1}</span> to{" "}
              <span className="font-bold text-slate-800">{Math.min(indexOfLastRow, houses.length)}</span> of{" "}
              <span className="font-bold text-slate-800">{houses.length}</span> accommodations
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
    </AppShell>
  );
}

