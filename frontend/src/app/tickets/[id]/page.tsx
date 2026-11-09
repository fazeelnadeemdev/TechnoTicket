"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Ticket, User, TicketComment } from "@/lib/types";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CloseTicketModal } from "@/components/modals/CloseTicketModal";
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  Building,
  MapPin,
  Calendar,
  Send,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  DollarSign,
  CreditCard,
  Check,
  Shield,
  ExternalLink,
  ChevronRight,
  X
} from "lucide-react";

const EXTERNAL_VENDORS = [
  "Brinks Armored Transport",
  "Loomis Armored US",
  "Saunders Contractor Services",
  "Apex HVAC & Electrical Solutions",
  "Commercial Alarm & Fire Security",
  "Spectrum Business Internet",
  "Comcast / Xfinity Enterprise",
  "Waste Management Dumpster Solutions",
  "City Water & Gas Municipal Utility",
  "Direct Store Supplies Inc",
  "Other",
];

export default function TicketProgressPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const { user } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [solvers, setSolvers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assignment controls
  const [isExternal, setIsExternal] = useState(false);
  const [selectedExternalVendor, setSelectedExternalVendor] = useState(EXTERNAL_VENDORS[0]);
  const [customTeamName, setCustomTeamName] = useState("");
  const [selectedSolverId, setSelectedSolverId] = useState<number | "">("");

  // Modals
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [reopenSubmitting, setReopenSubmitting] = useState(false);

  // Comments
  const [newComment, setNewComment] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Image Lightbox
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchTicket = useCallback(async () => {
    try {
      const data = await apiFetch<Ticket>(`/api/tickets/${ticketId}`);
      setTicket(data);
      if (data.solved_by_team === "External") {
        setIsExternal(true);
        if (EXTERNAL_VENDORS.includes(data.solved_by_name || "")) {
          setSelectedExternalVendor(data.solved_by_name || "Other");
        } else {
          setSelectedExternalVendor("Other");
          setCustomTeamName(data.solved_by_name || "");
        }
      } else if (data.assigned_to_id) {
        setSelectedSolverId(data.assigned_to_id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load ticket.");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  const fetchSolvers = useCallback(async () => {
    try {
      const data = await apiFetch<any[]>("/api/users/solvers");
      setSolvers(data);
    } catch (err) {
      console.error("Failed to load solvers", err);
    }
  }, []);

  useEffect(() => {
    fetchTicket();
    fetchSolvers();
  }, [fetchTicket, fetchSolvers]);

  // Handle quick actions
  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await apiFetch<Ticket>(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setTicket(res);
    } catch (err: any) {
      alert(err.message || "Failed to update ticket status.");
    }
  };

  // Reopen ticket with reason
  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim()) return;

    setReopenSubmitting(true);
    try {
      const res = await apiFetch<Ticket>(`/api/tickets/${ticketId}/reopen`, {
        method: "POST",
        body: JSON.stringify({ reason: reopenReason.trim() }),
      });
      setTicket(res);
      setReopenModalOpen(false);
      setReopenReason("");
    } catch (err: any) {
      alert(err.message || "Failed to reopen ticket.");
    } finally {
      setReopenSubmitting(false);
    }
  };

  // Handle internal or external assignment
  const handleAssignSubmit = async () => {
    if (isExternal) {
      const finalName = selectedExternalVendor === "Other" ? customTeamName.trim() : selectedExternalVendor;
      if (!finalName) {
        alert("Please enter or select an external vendor name.");
        return;
      }
      try {
        const res = await apiFetch<Ticket>(`/api/tickets/${ticketId}`, {
          method: "PATCH",
          body: JSON.stringify({
            status: "Assigned",
            solved_by_team: "External",
            solved_by_name: finalName,
            assigned_to_id: null,
            assigned_to_name: finalName,
          }),
        });
        setTicket(res);
      } catch (err: any) {
        alert(err.message || "Failed to assign external team.");
      }
    } else {
      if (!selectedSolverId) {
        alert("Please select an internal agent or solver.");
        return;
      }
      try {
        const res = await apiFetch<Ticket>(`/api/tickets/${ticketId}`, {
          method: "PATCH",
          body: JSON.stringify({
            status: "Assigned",
            assigned_to_id: Number(selectedSolverId),
            solved_by_team: "Internal",
          }),
        });
        setTicket(res);
      } catch (err: any) {
        alert(err.message || "Failed to assign ticket.");
      }
    }
  };

  // Orange "ASSIGN TO ME"
  const handleAssignToMe = async () => {
    if (!user) return;
    try {
      const res = await apiFetch<Ticket>(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "Assigned",
          assigned_to_id: user.id,
          assigned_to_name: user.name,
          solved_by_team: "Internal",
          solved_by_name: user.name,
        }),
      });
      setTicket(res);
      setSelectedSolverId(user.id);
      setIsExternal(false);
    } catch (err: any) {
      alert(err.message || "Failed to assign to yourself.");
    }
  };

  // Post comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommentSubmitting(true);
    try {
      const added = await apiFetch<TicketComment>(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        body: JSON.stringify({ comment_text: newComment.trim() }),
      });
      setTicket((prev) => (prev ? { ...prev, comments: [...(prev.comments || []), added] } : prev));
      setNewComment("");
    } catch (err: any) {
      alert(err.message || "Failed to post comment.");
    } finally {
      setCommentSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="py-24 text-center text-slate-400 text-sm">
          Loading Ticket Progress & Workflow...
        </div>
      </AppShell>
    );
  }

  if (error || !ticket) {
    return (
      <AppShell>
        <div className="p-8 text-center bg-white rounded-2xl border border-red-200 text-red-600 max-w-lg mx-auto mt-12 space-y-4">
          <p className="font-bold text-base">{error || "Ticket not found."}</p>
          <Link
            href="/tickets/manage"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-purple-800 text-white rounded-xl text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Manage Tickets</span>
          </Link>
        </div>
      </AppShell>
    );
  }

  // Priority color
  const priorityBadgeClass =
    ticket.priority === "High"
      ? "bg-red-50 text-red-700 border-red-200"
      : ticket.priority === "Medium"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  // Status badge color
  const statusBadgeClass =
    ticket.status === "Close"
      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
      : ticket.status === "Completed"
      ? "bg-blue-100 text-blue-900 border-blue-300"
      : ticket.status === "Hold"
      ? "bg-amber-100 text-amber-900 border-amber-300"
      : ticket.status === "Re-Open"
      ? "bg-red-100 text-red-900 border-red-300"
      : ticket.status === "Assigned"
      ? "bg-purple-100 text-purple-900 border-purple-300"
      : "bg-slate-100 text-slate-800 border-slate-300";

  // Stepper calculations
  const isCreated = true;
  const isPending = ticket.status === "Pending";
  const isReceived = ["Assigned", "Open", "Completed", "Close", "Hold", "Re-Open"].includes(ticket.status);
  const isHold = ticket.status === "Hold";
  const isAssigned = Boolean(ticket.assigned_to_id || ticket.solved_by_name);
  const isCompleted = ["Completed", "Close"].includes(ticket.status);
  const isClosed = ticket.status === "Close";
  const isReopened = ticket.status === "Re-Open";

  return (
    <AppShell>
      <div className="space-y-5 pb-12 print:p-0">
        {/* Top Header Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {ticket.ticket_code}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${priorityBadgeClass}`}>
                  {ticket.priority} Priority
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadgeClass}`}>
                  {ticket.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {ticket.category} • {ticket.department} Department • {ticket.market}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Status Action Buttons Bar */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
            <Shield className="w-4 h-4 text-purple-700" />
            <span>Workflow Actions:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* CLOSED */}
            <button
              type="button"
              onClick={() => setCloseModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>CLOSED</span>
            </button>

            {/* HOLD */}
            <button
              type="button"
              onClick={() => handleStatusChange("Hold")}
              className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 ${
                ticket.status === "Hold"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100"
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>HOLD</span>
            </button>

            {/* MARK AS COMPLETED */}
            <button
              type="button"
              onClick={() => handleStatusChange("Completed")}
              className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 ${
                ticket.status === "Completed"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-blue-900 border border-blue-300 hover:bg-blue-100"
              }`}
            >
              <Check className="w-4 h-4 text-blue-500" />
              <span>MARK AS COMPLETED</span>
            </button>

            {/* RE-OPEN */}
            <button
              type="button"
              onClick={() => setReopenModalOpen(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 ${
                ticket.status === "Re-Open"
                  ? "bg-red-600 text-white"
                  : "bg-red-50 text-red-900 border border-red-300 hover:bg-red-100"
              }`}
            >
              <RotateCcw className="w-4 h-4 text-red-500" />
              <span>RE-OPEN</span>
            </button>
          </div>
        </div>

        {/* Assignment Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center space-x-2 font-bold text-slate-800 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={isExternal}
                  onChange={(e) => setIsExternal(e.target.checked)}
                  className="rounded text-purple-700 focus:ring-purple-600 w-4 h-4"
                />
                <span>External Team?</span>
              </label>

              {isExternal ? (
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedExternalVendor}
                    onChange={(e) => setSelectedExternalVendor(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
                  >
                    {EXTERNAL_VENDORS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>

                  {selectedExternalVendor === "Other" && (
                    <input
                      type="text"
                      placeholder="Type Team Name..."
                      value={customTeamName}
                      onChange={(e) => setCustomTeamName(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 w-48"
                    />
                  )}

                  <button
                    type="button"
                    onClick={handleAssignSubmit}
                    className="px-4 py-2 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-bold"
                  >
                    ASSIGN EXTERNAL
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedSolverId}
                    onChange={(e) => setSelectedSolverId(Number(e.target.value))}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 max-w-xs"
                  >
                    <option value="">-- Select Internal Solver / Tech --</option>
                    {solvers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.department} • {s.active_tickets_count} active)
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleAssignSubmit}
                    className="px-4 py-2 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-bold"
                  >
                    {ticket.assigned_to_id ? "RE-ASSIGN" : "ASSIGN"}
                  </button>
                </div>
              )}
            </div>

            {/* Orange ASSIGN TO ME */}
            <button
              type="button"
              onClick={handleAssignToMe}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center space-x-1.5 self-start lg:self-auto"
            >
              <UserCheck className="w-4 h-4" />
              <span>ASSIGN TO ME</span>
            </button>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 cols): Details, Files, Comments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Core Ticket Information Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                Ticket Details & Location
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Ticket Creator:</span>
                  <span className="font-bold text-slate-900 text-sm">{ticket.creator_name}</span>
                  <div className="text-slate-500">{ticket.creator_email}</div>
                  {ticket.creator_phone && <div className="text-slate-400 font-mono">{ticket.creator_phone}</div>}
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Location ({ticket.location_type}):</span>
                  <div className="font-bold text-slate-900 flex items-center space-x-1.5 mt-0.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        ticket.location_type === "Store" ? "bg-orange-500" : "bg-emerald-500"
                      }`}
                    />
                    <span>{ticket.location_display}</span>
                  </div>
                  <div className="text-slate-400 mt-1">Market: {ticket.market}</div>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Assigned Agent / Solver:</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {ticket.assigned_to_name || ticket.solved_by_name || "Unassigned"}
                  </div>
                  <div className="text-slate-500">
                    Team: {ticket.solved_by_team || "Internal"}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Resolution Timelines:</span>
                  <div className="text-slate-700 font-semibold mt-0.5">
                    Open Duration: <span className="text-purple-900">{ticket.open_duration_days}</span>
                  </div>
                  <div className="text-slate-700 font-semibold">
                    Closed Duration: <span className="text-slate-900">{ticket.closed_duration_days}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 text-xs font-semibold block mb-1">Issue Description:</span>
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  {ticket.description}
                </p>
              </div>

              {/* Reopen Reason if any */}
              {ticket.reopen_reason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-red-900 uppercase text-[10px] flex items-center space-x-1">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Re-Open Justification:</span>
                  </span>
                  <p className="text-red-800 font-medium">{ticket.reopen_reason}</p>
                </div>
              )}
            </div>

            {/* Images Gallery */}
            {ticket.images && ticket.images.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4 text-purple-700" />
                  <span>Attached Photos ({ticket.images.length})</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ticket.images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setPreviewImage(img)}
                      className="group relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 cursor-pointer hover:border-purple-500 transition-all"
                    >
                      <img src={img} alt={`Ticket image ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                        Click to view
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents / Attachments */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-purple-700" />
                  <span>Attached Documents & Invoices ({ticket.attachments.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ticket.attachments.map((att: any, idx: number) => {
                    const url = typeof att === "string" ? att : att.url;
                    const name = typeof att === "string" ? `Attachment ${idx + 1}` : att.name;
                    return (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-200 hover:border-purple-400 bg-slate-50 hover:bg-white text-xs font-semibold text-slate-800 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="truncate flex-1">{name}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Comments Thread */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-3">
                <MessageSquare className="w-4 h-4 text-purple-700" />
                <span>Comments & Operational Updates ({ticket.comments?.length || 0})</span>
              </div>

              {/* Comments List */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {ticket.comments && ticket.comments.length > 0 ? (
                  ticket.comments.map((c) => (
                    <div key={c.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">{c.author_name}</span>
                          {c.author_department && (
                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-semibold">
                              {c.author_department}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap">{c.comment_text}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No comments posted yet on this ticket.
                  </div>
                )}
              </div>

              {/* Add Comment Box */}
              <form onSubmit={handleAddComment} className="pt-2 space-y-2">
                <textarea
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Post an operational update, technician note, or question..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={commentSubmitting}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{commentSubmitting ? "Posting..." : "Post Comment"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column (1 col): 8-Step Vertical TICKET PROGRESS Stepper */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-purple-700" />
                  <span>Ticket Progress</span>
                </span>
                <span className="text-[11px] text-purple-700 font-semibold">8 Steps</span>
              </div>

              {/* Stepper Timeline */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {/* Step 1: Created */}
                <div className="relative">
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                    ✓
                  </div>
                  <div className="text-xs font-bold text-slate-900">1. Created</div>
                  <div className="text-[11px] text-slate-500">
                    {new Date(ticket.created_at).toLocaleDateString()} by {ticket.creator_name}
                  </div>
                </div>

                {/* Step 2: Pending */}
                <div className="relative">
                  <div
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                      isPending
                        ? "bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse"
                        : "bg-emerald-500 text-white"
                    }`}
                  >
                    ✓
                  </div>
                  <div className="text-xs font-bold text-slate-900">2. Pending</div>
                  <div className="text-[11px] text-slate-500">Queued for department queue triage</div>
                </div>

                {/* Step 3: Received to Manager */}
                <div className="relative">
                  <div
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                      isReceived
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isReceived ? "✓" : "3"}
                  </div>
                  <div className="text-xs font-bold text-slate-900">3. Received to Manager</div>
                  <div className="text-[11px] text-slate-500">
                    {ticket.department} management desk review
                  </div>
                </div>

                {/* Step 4: Hold */}
                <div className="relative">
                  <div
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                      isHold
                        ? "bg-amber-600 text-white ring-4 ring-amber-100"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isHold ? "!" : "4"}
                  </div>
                  <div className="text-xs font-bold text-slate-900">4. Hold</div>
                  <div className="text-[11px] text-slate-500">
                    {isHold ? "Awaiting parts, vendor, or store approval" : "Status not on hold"}
                  </div>
                </div>

                {/* Step 5: Assigned to Agent / External */}
                <div className="relative">
                  <div
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                      isAssigned
                        ? "bg-purple-800 text-white ring-4 ring-purple-100"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isAssigned ? "✓" : "5"}
                  </div>
                  <div className="text-xs font-bold text-slate-900">5. Assigned to Agent/External</div>
                  <div className="text-[11px] text-slate-600 font-semibold">
                    {ticket.assigned_to_name || ticket.solved_by_name || "Awaiting dispatcher assignment"}
                  </div>
                </div>

                {/* Step 6: Completed */}
                <div className="relative">
                  <div
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                      isCompleted
                        ? "bg-blue-600 text-white ring-4 ring-blue-100"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isCompleted ? "✓" : "6"}
                  </div>
                  <div className="text-xs font-bold text-slate-900">6. Completed</div>
                  <div className="text-[11px] text-slate-500">
                    {isCompleted ? "Physical work/order finalized" : "Pending resolution"}
                  </div>
                </div>

                {/* Step 7: Closed */}
                <div className="relative">
                  <div
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                      isClosed
                        ? "bg-slate-950 text-white ring-4 ring-slate-200"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isClosed ? "✓" : "7"}
                  </div>
                  <div className="text-xs font-bold text-slate-900">7. Closed</div>
                  <div className="text-[11px] text-slate-500">
                    {isClosed && ticket.closed_at
                      ? `Closed on ${new Date(ticket.closed_at).toLocaleDateString()}`
                      : "Checklist and invoice verification"}
                  </div>
                </div>

                {/* Step 8: Re-open */}
                <div className="relative">
                  <div
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                      isReopened
                        ? "bg-red-600 text-white ring-4 ring-red-100 animate-pulse"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isReopened ? "!" : "8"}
                  </div>
                  <div className="text-xs font-bold text-slate-900">8. Re-open</div>
                  <div className="text-[11px] text-slate-500">
                    {isReopened ? "Re-opened with justification" : "Ticket in standard cycle"}
                  </div>
                </div>
              </div>

              {/* Payment Details if Closed */}
              {ticket.payment_required && (
                <div className="mt-4 p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-xs space-y-2">
                  <div className="font-bold text-purple-900 uppercase text-[11px] flex items-center space-x-1.5">
                    <DollarSign className="w-4 h-4 text-purple-700" />
                    <span>Payment Validation Record</span>
                  </div>
                  <div className="space-y-1 text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Method:</span>
                      <span className="font-semibold">{ticket.payment_method || "N/A"}</span>
                    </div>
                    {ticket.card_last_four && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Card Last 4:</span>
                        <span className="font-mono font-semibold">•••• {ticket.card_last_four}</span>
                      </div>
                    )}
                    {ticket.payment_amount !== null && ticket.payment_amount !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Amount Paid:</span>
                        <span className="font-bold text-purple-900">${ticket.payment_amount.toFixed(2)}</span>
                      </div>
                    )}
                    {ticket.invoice_url && (
                      <div className="pt-1 border-t border-purple-200/60">
                        <a
                          href={ticket.invoice_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-purple-700 hover:underline font-bold flex items-center space-x-1 text-[11px]"
                        >
                          <span>View Official Invoice / Receipt</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Close Ticket Modal */}
      {closeModalOpen && (
        <CloseTicketModal
          ticket={ticket}
          isOpen={closeModalOpen}
          onClose={() => setCloseModalOpen(false)}
          onSuccess={(updated) => {
            setTicket(updated);
            setCloseModalOpen(false);
          }}
        />
      )}

      {/* Reopen Reason Modal */}
      {reopenModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-red-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-red-200" />
                <h2 className="text-base font-bold">Re-Open Ticket</h2>
              </div>
              <button onClick={() => setReopenModalOpen(false)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReopenSubmit} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Provide a clear operational reason explaining why this ticket is being re-opened:
              </p>
              <textarea
                rows={4}
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="e.g. Issue recurred, store reported incomplete repair, or replacement equipment defective..."
                className="w-full text-xs rounded-xl border border-slate-200 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-red-600 font-medium"
                required
              />
              <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReopenModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reopenSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {reopenSubmitting ? "Re-opening..." : "Confirm Re-Open"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
            <img src={previewImage} alt="Enlarged view" className="max-h-[85vh] max-w-full rounded-2xl object-contain" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 text-white bg-black/50 p-2 rounded-full hover:bg-black/70"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

