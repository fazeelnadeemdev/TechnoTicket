"use client";

import React, { useState } from "react";
import { X, Download, Filter, UserCheck, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_URL, getAuthToken } from "@/lib/api";

interface ExportTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters?: {
    status?: string;
    department?: string;
    market?: string;
    priority?: string;
    search?: string;
  };
}

export const ExportTicketsModal: React.FC<ExportTicketsModalProps> = ({
  isOpen,
  onClose,
  currentFilters = {},
}) => {
  const { user, activeDepartment } = useAuth();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggerDownload = async (mode: "filtered" | "own" | "admin") => {
    setDownloading(mode);
    setSuccessMsg(null);
    try {
      const token = getAuthToken();
      const params = new URLSearchParams({
        mode,
        department: mode === "admin" ? activeDepartment : currentFilters.department || "",
        status: currentFilters.status || "",
        market: currentFilters.market || "",
        priority: currentFilters.priority || "",
        search: currentFilters.search || "",
      });

      const url = `${API_URL}/api/tickets/export/csv?${params.toString()}`;
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error("Failed to export tickets");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `techno_tickets_${mode}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setSuccessMsg(`Successfully generated and downloaded ${mode.toUpperCase()} tickets report!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Export failed.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-purple-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-purple-300" />
            <div>
              <h2 className="text-base font-bold">Export Tickets Data</h2>
              <p className="text-xs text-purple-200">Select reporting scope to download CSV</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            {/* Option 1: Current Filtered View */}
            <button
              onClick={() => triggerDownload("filtered")}
              disabled={!!downloading}
              className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-purple-600 bg-white hover:bg-purple-50/50 transition-all flex items-start space-x-3.5 group shadow-sm"
            >
              <div className="p-2.5 rounded-lg bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Filter className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-800 group-hover:text-purple-900">
                  EXPORT CURRENT FILTERED VIEW
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Downloads rows matching the active search, date, market, and status filters.
                </div>
              </div>
            </button>

            {/* Option 2: Only My Tickets */}
            <button
              onClick={() => triggerDownload("own")}
              disabled={!!downloading}
              className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-purple-600 bg-white hover:bg-purple-50/50 transition-all flex items-start space-x-3.5 group shadow-sm"
            >
              <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-800 group-hover:text-purple-900">
                  EXPORT ONLY MY TICKETS
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Exports all tickets created by {user?.name || "you"}.
                </div>
              </div>
            </button>

            {/* Option 3: Admin Department Tickets */}
            <button
              onClick={() => triggerDownload("admin")}
              disabled={!!downloading}
              className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-purple-600 bg-white hover:bg-purple-50/50 transition-all flex items-start space-x-3.5 group shadow-sm"
            >
              <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-800 group-hover:text-purple-900">
                  EXPORT ADMIN TICKETS ({activeDepartment.toUpperCase()})
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Exports all enterprise tickets for the active department context.
                </div>
              </div>
            </button>
          </div>

          <div className="text-center pt-2">
            <span className="text-[11px] text-slate-400">
              CSV file includes all timestamps, ticket IDs, solvers, and payment closing validations.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

