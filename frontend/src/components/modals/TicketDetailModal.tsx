"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  User,
  Building,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Image as ImageIcon,
  Shield,
  ExternalLink,
  Lock,
  Phone,
  Mail,
  AlertCircle
} from "lucide-react";
import { Ticket, SolverUser } from "@/lib/types";
import { apiFetch, API_URL } from "@/lib/api";
import { CloseTicketModal } from "./CloseTicketModal";

interface TicketDetailModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onTicketUpdated: (updatedTicket: Ticket) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onTicketUpdated,
}) => {
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(ticket);
  const [solvers, setSolvers] = useState<SolverUser[]>([]);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingSolver, setUpdatingSolver] = useState(false);

  useEffect(() => {
    setCurrentTicket(ticket);
  }, [ticket]);

  // Load solvers list
  useEffect(() => {
    if (!isOpen) return;
    const fetchSolvers = async () => {
      try {
        const data = await apiFetch<SolverUser[]>("/api/users/solvers");
        setSolvers(data);
      } catch (err) {
        console.error("Failed to load solvers", err);
      }
    };
    fetchSolvers();
  }, [isOpen]);

  if (!isOpen || !currentTicket) return null;

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus.toLowerCase() === "close") {
      setCloseModalOpen(true);
      return;
    }

    setUpdatingStatus(true);
    try {
      const updated = await apiFetch<Ticket>(`/api/tickets/${currentTicket.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setCurrentTicket(updated);
      onTicketUpdated(updated);
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSolverChange = async (solverIdStr: string) => {
    if (!solverIdStr) return;
    const solverId = Number(solverIdStr);
    const chosenSolver = solvers.find((s) => s.id === solverId);

    setUpdatingSolver(true);
    try {
      const updated = await apiFetch<Ticket>(`/api/tickets/${currentTicket.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          assigned_to_id: solverId,
          assigned_to_name: chosenSolver?.name,
          solved_by_team: chosenSolver?.team_type,
          solved_by_name: chosenSolver?.name,
        }),
      });
      setCurrentTicket(updated);
      onTicketUpdated(updated);
    } catch (err: any) {
      alert(err.message || "Failed to assign solver");
    } finally {
      setUpdatingSolver(false);
    }
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
    <>
      <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 bg-purple-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-base font-bold bg-white/10 px-2.5 py-1 rounded-lg border border-white/20">
                {currentTicket.ticket_code}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getPriorityBadge(
                  currentTicket.priority
                )}`}
              >
                {currentTicket.priority} Priority
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(
                  currentTicket.status
                )}`}
              >
                {currentTicket.status}
              </span>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
            {/* Location Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-3">
                <span
                  className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                    currentTicket.location_type === "Store" ? "bg-orange-500" : "bg-emerald-500"
                  }`}
                  title={currentTicket.location_type}
                />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    {currentTicket.location_type} • {currentTicket.market} Market
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {currentTicket.location_display}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Category</span>
                <span className="inline-block bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-md text-xs">
                  {currentTicket.category} ({currentTicket.department})
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Issue Description
              </span>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
                {currentTicket.description}
              </div>
            </div>

            {/* Two-Column Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Creator Card */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <div className="flex items-center space-x-2 text-slate-400 font-bold uppercase text-[10px] mb-2.5">
                  <User className="w-3.5 h-3.5 text-purple-700" />
                  <span>Reported By</span>
                </div>
                <div className="font-bold text-slate-900 text-sm">{currentTicket.creator_name}</div>
                <div className="flex items-center space-x-1.5 text-slate-500 mt-1">
                  <Mail className="w-3 h-3" />
                  <span>{currentTicket.creator_email}</span>
                </div>
                {currentTicket.creator_phone && (
                  <div className="flex items-center space-x-1.5 text-slate-500 mt-0.5">
                    <Phone className="w-3 h-3" />
                    <span>{currentTicket.creator_phone}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1.5 text-slate-400 mt-2 text-[11px]">
                  <Calendar className="w-3 h-3" />
                  <span>Created: {new Date(currentTicket.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Assignment & Solver Card */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <div className="flex items-center space-x-2 text-slate-400 font-bold uppercase text-[10px] mb-2.5">
                  <Shield className="w-3.5 h-3.5 text-purple-700" />
                  <span>Assigned Solver / Technician</span>
                </div>

                <div className="mb-2">
                  <select
                    value={currentTicket.assigned_to_id || ""}
                    onChange={(e) => handleSolverChange(e.target.value)}
                    disabled={updatingSolver}
                    className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                  >
                    <option value="">-- Unassigned (Click to Assign) --</option>
                    {solvers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.team_type} • {s.department}) [{s.active_tickets_count} active]
                      </option>
                    ))}
                  </select>
                </div>

                {currentTicket.solved_by_name && (
                  <div className="text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-700">{currentTicket.solved_by_name}</span>{" "}
                    <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      {currentTicket.solved_by_team || "Internal"}
                    </span>
                  </div>
                )}

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Open Duration:</span>
                  <span className="font-bold text-purple-900">{currentTicket.open_duration_days}</span>
                </div>
              </div>
            </div>

            {/* Images & Attachments Gallery */}
            {(currentTicket.images.length > 0 || currentTicket.attachments.length > 0) && (
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Attached Files & Photos
                </div>

                {/* Images */}
                {currentTicket.images.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block mb-1.5">
                      Photos ({currentTicket.images.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {currentTicket.images.map((imgUrl, i) => (
                        <a
                          key={i}
                          href={imgUrl.startsWith("http") ? imgUrl : `${API_URL}${imgUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-purple-600 transition-colors font-medium text-purple-700"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Photo {i + 1}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents / Videos */}
                {currentTicket.attachments.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block mb-1.5">
                      Documents / Videos ({currentTicket.attachments.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {currentTicket.attachments.map((att, i) => (
                        <a
                          key={i}
                          href={att.url.startsWith("http") ? att.url : `${API_URL}${att.url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-purple-600 transition-colors font-medium text-slate-700"
                        >
                          <FileText className="w-3.5 h-3.5 text-purple-600" />
                          <span className="truncate max-w-[180px]">{att.name || `Document ${i + 1}`}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Closing & Payment Validation Information Card (if closed or payment recorded) */}
            {(currentTicket.status.toLowerCase() === "close" || currentTicket.payment_required) && (
              <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Resolution & Closing Validation Sign-Off</span>
                  </div>
                  {currentTicket.closed_at && (
                    <span className="text-[11px] text-emerald-700 font-medium">
                      Closed: {new Date(currentTicket.closed_at).toLocaleDateString()} ({currentTicket.closed_duration_days})
                    </span>
                  )}
                </div>

                {currentTicket.closing_notes && (
                  <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-emerald-100">
                    <span className="font-semibold text-emerald-900 block text-[11px] mb-0.5">
                      Technician Closing Notes:
                    </span>
                    {currentTicket.closing_notes}
                  </div>
                )}

                {currentTicket.payment_required && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                      <span className="text-slate-400 block text-[10px]">Payment Method</span>
                      <span className="font-bold text-slate-800">
                        {currentTicket.payment_method || "Card"}
                        {currentTicket.card_last_four && ` (•••• ${currentTicket.card_last_four})`}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                      <span className="text-slate-400 block text-[10px]">Amount Paid</span>
                      <span className="font-bold text-emerald-700">
                        ${currentTicket.payment_amount?.toFixed(2) || "0.00"}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Invoice / Receipt</span>
                        <span className="font-bold text-slate-700">
                          {currentTicket.invoice_url ? "Attached" : "None"}
                        </span>
                      </div>
                      {currentTicket.invoice_url && (
                        <a
                          href={
                            currentTicket.invoice_url.startsWith("http")
                              ? currentTicket.invoice_url
                              : `${API_URL}${currentTicket.invoice_url}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-purple-700 hover:text-purple-900 font-semibold text-[11px] flex items-center space-x-1"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Quick Status Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500">Update Status:</span>
              <select
                value={currentTicket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updatingStatus}
                className="text-xs rounded-lg border border-slate-300 p-1.5 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="Pending">Pending</option>
                <option value="Assigned">Assigned</option>
                <option value="Open">Open</option>
                <option value="Completed">Completed</option>
                <option value="Hold">Hold</option>
                <option value="Re-Open">Re-Open</option>
                <option value="Close">Close (Requires Validation)</option>
              </select>
            </div>

            {/* Close Button / Validation Trigger */}
            <div className="flex items-center space-x-2">
              {currentTicket.status.toLowerCase() !== "close" && (
                <button
                  type="button"
                  onClick={() => setCloseModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-purple-800 hover:bg-purple-900 text-white text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Close Ticket & Validate</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-white transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Child Closing Modal */}
      {closeModalOpen && (
        <CloseTicketModal
          ticket={currentTicket}
          isOpen={closeModalOpen}
          onClose={() => setCloseModalOpen(false)}
          onSuccess={(updated) => {
            setCurrentTicket(updated);
            onTicketUpdated(updated);
            setCloseModalOpen(false);
          }}
        />
      )}
    </>
  );
};

