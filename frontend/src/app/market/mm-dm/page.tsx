"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MMDMInfo } from "@/lib/types";
import { apiFetch } from "@/lib/api";
import {
  Contact2,
  Search,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Shield,
  User,
  RotateCcw,
  BadgeCheck
} from "lucide-react";
import { MMDMModal } from "@/components/modals/MMDMModal";

export default function MMDMPage() {
  const [records, setRecords] = useState<MMDMInfo[]>([]);
  const [markets, setMarkets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [marketFilter, setMarketFilter] = useState("All Markets");
  const [titleFilter, setTitleFilter] = useState("All Titles");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MMDMInfo | null>(null);

  // Load distinct markets
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

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        market: marketFilter === "All Markets" ? "" : marketFilter,
        title: titleFilter === "All Titles" ? "" : titleFilter,
        search: search.trim(),
      });
      const data = await apiFetch<MMDMInfo[]>(`/api/mm-dm?${params.toString()}`);
      setRecords(data);
    } catch (err) {
      console.error("Failed to load MM/DM directory", err);
    } finally {
      setLoading(false);
    }
  }, [marketFilter, titleFilter, search]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleEdit = (rec: MMDMInfo) => {
    setEditingRecord(rec);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this record?")) return;
    try {
      await apiFetch(`/api/mm-dm/${id}`, { method: "DELETE" });
      fetchRecords();
    } catch (err: any) {
      alert(err.message || "Failed to delete record");
    }
  };

  const handleReset = () => {
    setMarketFilter("All Markets");
    setTitleFilter("All Titles");
    setSearch("");
  };

  // Distinct titles present in data
  const titles = [
    "All Titles",
    "DISTRICT MANAGER",
    "MARKET MANAGER",
    "COMPLIANCE MANAGER",
    "TRAINER",
    "STATE MANAGER",
    "SALES DIRECTOR",
    "TERRITORY MANAGER"
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Contact2 className="w-5 h-5 text-purple-700" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">MM / DM Leadership Directory</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Market Managers, District Managers & Compliance Leadership ({records.length} leaders)
            </p>
          </div>

          <button
            onClick={handleAdd}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-800 hover:bg-purple-900 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>ADD LEADER / DIRECTORY</span>
          </button>
        </div>

        {/* Filters Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Title Filter */}
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-500">Title:</span>
              <select
                value={titleFilter}
                onChange={(e) => setTitleFilter(e.target.value)}
                className="rounded-xl border border-slate-200 p-2 bg-slate-50 focus:bg-white font-medium"
              >
                {titles.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
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

          {/* Search */}
          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, title, email, NTID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 pl-8 p-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
        </div>

        {/* Directory Cards Grid */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <div className="inline-block w-6 h-6 border-2 border-purple-300 border-t-purple-700 rounded-full animate-spin mb-2" />
            <div>Loading leadership directory...</div>
          </div>
        ) : records.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            No records found matching filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {records.map((rec) => (
              <div
                key={rec.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
              >
                {/* Header */}
                <div className="px-5 py-3.5 bg-gradient-to-r from-purple-900 to-purple-800 text-white flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm tracking-wide leading-tight">{rec.name}</div>
                    <div className="text-[10px] text-purple-200 font-semibold tracking-wider uppercase mt-0.5">
                      {rec.title || "LEADERSHIP"}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEdit(rec)}
                      className="p-1 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition-colors"
                      title="Edit Record"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(rec.id)}
                      className="p-1 rounded-lg text-purple-200 hover:text-red-300 hover:bg-white/10 transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400 font-medium">Market Territory:</span>
                    <span className="font-bold text-purple-900">{rec.market}</span>
                  </div>

                  {rec.ntid && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 font-medium">NTID:</span>
                      <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {rec.ntid}
                      </span>
                    </div>
                  )}

                  {rec.bdi_login && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 font-medium">BDI Login:</span>
                      <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {rec.bdi_login}
                      </span>
                    </div>
                  )}

                  {rec.email && (
                    <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100">
                      <span className="text-slate-400 flex items-center space-x-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>Email:</span>
                      </span>
                      <a href={`mailto:${rec.email}`} className="text-purple-700 hover:underline font-medium truncate max-w-[170px]">
                        {rec.email}
                      </a>
                    </div>
                  )}

                  {rec.phone && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>Contact:</span>
                      </span>
                      <span className="font-medium text-slate-800">{rec.phone}</span>
                    </div>
                  )}
                </div>

                <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Leadership Matrix</span>
                  <span className="font-bold text-slate-600">{rec.market}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <MMDMModal
          record={editingRecord}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            fetchRecords();
          }}
        />
      )}
    </AppShell>
  );
}
