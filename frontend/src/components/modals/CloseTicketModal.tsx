"use client";

import React, { useState } from "react";
import { X, CheckSquare, DollarSign, Upload, AlertCircle, ShieldCheck } from "lucide-react";
import { Ticket } from "@/lib/types";
import { apiFetch } from "@/lib/api";

interface CloseTicketModalProps {
  ticket: Ticket;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Ticket) => void;
}

export const CloseTicketModal: React.FC<CloseTicketModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [checklistVerified, setChecklistVerified] = useState(false);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Corporate Visa");
  const [cardLastFour, setCardLastFour] = useState("");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [invoiceUrl, setInvoiceUrl] = useState<string>("");
  const [closingNotes, setClosingNotes] = useState("");
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingInvoice(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiFetch<{ url: string }>("/api/upload", {
        method: "POST",
        body: formData,
      });
      setInvoiceUrl(res.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload invoice.");
    } finally {
      setUploadingInvoice(false);
    }
  };

  const handleCloseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!checklistVerified) {
      setError("You must verify that all resolution work is completed.");
      return;
    }

    if (!closingNotes.trim()) {
      setError("Please provide closing notes detailing the resolution.");
      return;
    }

    if (paymentRequired) {
      if (!cardLastFour.trim() && !paymentMethod) {
        setError("Payment method and card details are required when payment is marked as required.");
        return;
      }
      if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
        setError("Please enter a valid positive payment amount ($).");
        return;
      }
    }

    setSubmitting(true);
    try {
      const updatedTicket = await apiFetch<Ticket>(`/api/tickets/${ticket.id}/close`, {
        method: "POST",
        body: JSON.stringify({
          closing_checklist_verified: checklistVerified,
          payment_required: paymentRequired,
          payment_method: paymentRequired ? paymentMethod : null,
          card_last_four: paymentRequired ? cardLastFour.trim() : null,
          payment_amount: paymentRequired ? parseFloat(paymentAmount) : null,
          invoice_url: paymentRequired ? invoiceUrl : null,
          closing_notes: closingNotes.trim(),
        }),
      });

      onSuccess(updatedTicket);
    } catch (err: any) {
      setError(err.message || "Failed to close ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-purple-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-purple-300" />
            <div>
              <h2 className="text-base font-bold">Closing & Payment Validation</h2>
              <p className="text-xs text-purple-200">{ticket.ticket_code} — {ticket.location_display}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleCloseSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Checklist Verification Checkbox */}
          <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checklistVerified}
                onChange={(e) => setChecklistVerified(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-purple-700 rounded border-slate-300 focus:ring-purple-600"
              />
              <div className="text-xs">
                <span className="font-bold text-purple-950 block">Resolution Checklist Verified *</span>
                <span className="text-purple-700">
                  I confirm the reported store issue has been resolved, inspected, and verified on-site.
                </span>
              </div>
            </label>
          </div>

          {/* Payment Required Toggle */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Payment Required?</span>
                <span className="text-[11px] text-slate-500 block">
                  Does this resolution involve company card expenses, invoices, or contractor fees?
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPaymentRequired(!paymentRequired)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  paymentRequired ? "bg-purple-700" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    paymentRequired ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Payment Fields (conditionally revealed) */}
            {paymentRequired && (
              <div className="mt-4 pt-3 border-t border-slate-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      <option value="Corporate Visa">Corporate Visa</option>
                      <option value="Corporate Amex">Corporate Amex</option>
                      <option value="Company Mastercard">Company Mastercard</option>
                      <option value="Bank Wire">Bank Wire</option>
                      <option value="Check">Check</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Card Last 4 Digits
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="e.g. 4821"
                      value={cardLastFour}
                      onChange={(e) => setCardLastFour(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Payment Amount ($ USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-200 pl-8 p-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Invoice / Receipt Upload (PDF/Image)
                  </label>
                  <label className="border border-dashed border-slate-300 rounded-lg p-2.5 bg-white text-center cursor-pointer hover:bg-slate-50 block">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleInvoiceUpload}
                      className="hidden"
                    />
                    <Upload className="w-4 h-4 text-purple-600 mx-auto mb-0.5" />
                    <span className="text-xs text-slate-600 block">
                      {uploadingInvoice
                        ? "Uploading invoice..."
                        : invoiceUrl
                        ? "Invoice uploaded successfully (Click to replace)"
                        : "Upload paid invoice/receipt"}
                    </span>
                  </label>
                  {invoiceUrl && (
                    <div className="mt-1 text-[11px] text-emerald-600 font-medium">
                      ✓ File attached: {invoiceUrl.split("/").pop()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Closing Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Closing / Resolution Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              placeholder="Provide a detailed summary of steps taken, parts replaced, technician sign-off..."
              className="w-full text-xs rounded-xl border border-slate-200 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 placeholder:text-slate-400"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !checklistVerified}
              className="px-5 py-2.5 rounded-xl bg-purple-800 hover:bg-purple-900 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center space-x-2"
            >
              <CheckSquare className="w-4 h-4" />
              <span>{submitting ? "Closing Ticket..." : "Verify & Close Ticket"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

