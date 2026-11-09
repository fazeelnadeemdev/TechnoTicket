"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { DashboardMetrics } from "@/lib/types";
import { apiFetch } from "@/lib/api";
import {
  Download,
  Plus,
  RotateCcw,
  Calendar,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  PauseCircle,
  RefreshCw,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { CreateTicketModal } from "@/components/modals/CreateTicketModal";
import { ExportTicketsModal } from "@/components/modals/ExportTicketsModal";

const MARKETS = [
  "All Markets",
  "Arizona",
  "Houston",
  "Bay Area",
  "Memphis",
  "Philly",
  "Utah",
  "Miami",
  "El Paso",
  "Arkansas"
];

const PRIORITIES = ["All Priorities", "Low", "Medium", "High"];

export default function DashboardPage() {
  const { activeDepartment } = useAuth();

  // Filter States
  const [dateMode, setDateMode] = useState<"created" | "updated">("created");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [market, setMarket] = useState("All Markets");
  const [priority, setPriority] = useState("All Priorities");

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Data
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        date_mode: dateMode,
        market: market === "All Markets" ? "" : market,
        priority: priority === "All Priorities" ? "" : priority,
        date_from: dateFrom ? new Date(dateFrom).toISOString() : "",
        date_to: dateTo ? new Date(dateTo).toISOString() : "",
      });

      const data = await apiFetch<DashboardMetrics>(`/api/dashboard/metrics?${params.toString()}`);
      setMetrics(data);
    } catch (err) {
      console.error("Failed to load dashboard metrics", err);
    } finally {
      setLoading(false);
    }
  }, [dateMode, market, priority, dateFrom, dateTo]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Listen to global ticket created event
  useEffect(() => {
    const handleTicketCreated = () => fetchMetrics();
    window.addEventListener("techno:ticket-created", handleTicketCreated);
    return () => window.removeEventListener("techno:ticket-created", handleTicketCreated);
  }, [fetchMetrics]);

  const handleResetFilters = () => {
    setDateMode("created");
    setDateFrom("");
    setDateTo("");
    setMarket("All Markets");
    setPriority("All Priorities");
  };

  const total = metrics?.kpi.total || 0;

  const kpiCards = [
    { label: "Total Tickets", count: metrics?.kpi.total || 0, color: "border-purple-600 bg-purple-50/50 text-purple-900", icon: Layers, ratio: `${total}/${total}` },
    { label: "Pending", count: metrics?.kpi.pending || 0, color: "border-amber-500 bg-amber-50/50 text-amber-900", icon: Clock, ratio: `${metrics?.kpi.pending || 0}/${total}` },
    { label: "Assigned", count: metrics?.kpi.assigned || 0, color: "border-blue-500 bg-blue-50/50 text-blue-900", icon: RefreshCw, ratio: `${metrics?.kpi.assigned || 0}/${total}` },
    { label: "Open", count: metrics?.kpi.open || 0, color: "border-emerald-500 bg-emerald-50/50 text-emerald-900", icon: AlertCircle, ratio: `${metrics?.kpi.open || 0}/${total}` },
    { label: "Completed", count: metrics?.kpi.completed || 0, color: "border-cyan-500 bg-cyan-50/50 text-cyan-900", icon: CheckCircle2, ratio: `${metrics?.kpi.completed || 0}/${total}` },
    { label: "Closed", count: metrics?.kpi.closed || 0, color: "border-slate-500 bg-slate-50 text-slate-800", icon: CheckCircle2, ratio: `${metrics?.kpi.closed || 0}/${total}` },
    { label: "Hold", count: metrics?.kpi.hold || 0, color: "border-indigo-500 bg-indigo-50/50 text-indigo-900", icon: PauseCircle, ratio: `${metrics?.kpi.hold || 0}/${total}` },
    { label: "Re-Open", count: metrics?.kpi.re_open || 0, color: "border-rose-500 bg-rose-50/50 text-rose-900", icon: RotateCcw, ratio: `${metrics?.kpi.re_open || 0}/${total}` },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Admin Executive Dashboard</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Techno Communications LLC • Real-Time Franchise Service Operations
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Created vs Last Updated Mode Toggle */}
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

            {/* Export Tickets Button */}
            <button
              type="button"
              onClick={() => setExportModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-purple-700" />
              <span>EXPORT TICKETS</span>
            </button>

            {/* Create New Ticket Button */}
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-800 hover:bg-purple-900 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>CREATE NEW TICKET</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs items-end">
          {/* From Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
            />
          </div>

          {/* Priorities Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Market Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Market</label>
            <select
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
            >
              {MARKETS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Button */}
          <div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full flex items-center justify-center space-x-1.5 p-2 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* 8 KPI Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className={`p-3.5 rounded-2xl border-l-4 border shadow-sm flex flex-col justify-between ${kpi.color} bg-white transition-all hover:shadow-md`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
                    {kpi.label}
                  </span>
                  <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {kpi.count}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {kpi.ratio}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Analytics Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Tickets Summary (Last 1 Year) Monthly Bar Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-purple-700" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Tickets Summary (Last 1 Year)
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                Monthly Inflow
              </span>
            </div>

            <div className="h-64 w-full">
              {metrics?.monthly_trend ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.monthly_trend}>
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        fontSize: "11px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        border: "1px solid #e2e8f0",
                      }}
                    />
                    <Bar dataKey="count" fill="#7E22CE" radius={[4, 4, 0, 0]} name="Tickets" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Loading trend data...
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Department-wise Ticket Status Stacked Bar by Age Buckets */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-purple-700" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Department-wise Ticket Status (By Age)
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Resolution Velocity
              </span>
            </div>

            <div className="h-64 w-full">
              {metrics?.department_age_buckets ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.department_age_buckets}>
                    <XAxis dataKey="department" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        fontSize: "11px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        border: "1px solid #e2e8f0",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="bucket_0_7" stackId="a" fill="#10B981" name="0–7 Days" />
                    <Bar dataKey="bucket_8_15" stackId="a" fill="#F59E0B" name="8–15 Days" />
                    <Bar dataKey="bucket_16_30" stackId="a" fill="#F97316" name="16–30 Days" />
                    <Bar dataKey="bucket_30_plus" stackId="a" fill="#EF4444" name="30+ Days" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Loading department buckets...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row Charts (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chart 3: Tickets by Category Donut */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center space-x-2 mb-3">
              <PieChartIcon className="w-4 h-4 text-purple-700" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">Tickets by Category</h3>
            </div>
            <div className="h-56 w-full">
              {metrics?.tickets_by_category && metrics.tickets_by_category.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.tickets_by_category}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                    >
                      {metrics.tickets_by_category.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || "#9333EA"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        fontSize: "11px",
                        border: "1px solid #e2e8f0",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No data
                </div>
              )}
            </div>
            {/* Category Quick Tags */}
            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto mt-2">
              {metrics?.tickets_by_category.slice(0, 6).map((c) => (
                <span
                  key={c.name}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 flex items-center space-x-1"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: c.color || "#7E22CE" }}
                  />
                  <span>
                    {c.name} ({c.count})
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Chart 4: Tickets by Status */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center space-x-2 mb-3">
              <PieChartIcon className="w-4 h-4 text-purple-700" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">Tickets by Status</h3>
            </div>
            <div className="h-56 w-full">
              {metrics?.tickets_by_status && metrics.tickets_by_status.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.tickets_by_status}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                    >
                      {metrics.tickets_by_status.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || "#3B82F6"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        fontSize: "11px",
                        border: "1px solid #e2e8f0",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No data
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {metrics?.tickets_by_status.map((s) => (
                <span
                  key={s.name}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 flex items-center space-x-1"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: s.color || "#7E22CE" }}
                  />
                  <span>
                    {s.name} ({s.count})
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Chart 5: Tickets by Priority */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center space-x-2 mb-3">
              <PieChartIcon className="w-4 h-4 text-purple-700" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">Tickets by Priority</h3>
            </div>
            <div className="h-56 w-full">
              {metrics?.tickets_by_priority && metrics.tickets_by_priority.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.tickets_by_priority}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={75}
                    >
                      {metrics.tickets_by_priority.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || "#EF4444"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        fontSize: "11px",
                        border: "1px solid #e2e8f0",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No data
                </div>
              )}
            </div>
            <div className="flex justify-center space-x-3 mt-2">
              {metrics?.tickets_by_priority.map((p) => (
                <span
                  key={p.name}
                  className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 flex items-center space-x-1"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: p.color || "#EF4444" }}
                  />
                  <span>
                    {p.name}: {p.count}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {createModalOpen && (
        <CreateTicketModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            fetchMetrics();
          }}
        />
      )}

      {exportModalOpen && (
        <ExportTicketsModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          currentFilters={{
            market: market === "All Markets" ? "" : market,
            priority: priority === "All Priorities" ? "" : priority,
          }}
        />
      )}
    </AppShell>
  );
}

