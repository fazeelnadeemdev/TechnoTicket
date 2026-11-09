"use client";

import React, { useState, useEffect } from "react";
import { X, Contact2, AlertCircle } from "lucide-react";
import { MMDMInfo } from "@/lib/types";
import { apiFetch } from "@/lib/api";

interface MMDMModalProps {
  record?: MMDMInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MARKETS = [
  "ARIZONA", "ARKANSAS", "BAY AREA", "DALLAS", "EL PASO", "HOUSTON",
  "MEMPHIS", "MIAMI", "PHILLY", "UTAH"
];

const TITLES = [
  "MARKET MANAGER",
  "DISTRICT MANAGER",
  "COMPLIANCE MANAGER",
  "TRAINER",
  "STATE MANAGER",
  "SALES DIRECTOR",
  "TERRITORY MANAGER"
];

export const MMDMModal: React.FC<MMDMModalProps> = ({
  record,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [market, setMarket] = useState("ARIZONA");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("DISTRICT MANAGER");
  const [ntid, setNtid] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bdiLogin, setBdiLogin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setMarket(record.market);
      setName(record.name);
      setTitle(record.title || "DISTRICT MANAGER");
      setNtid(record.ntid || "");
      setEmail(record.email || "");
      setPhone(record.phone || "");
      setBdiLogin(record.bdi_login || "");
    } else {
      setMarket("ARIZONA");
      setName("");
      setTitle("DISTRICT MANAGER");
      setNtid("");
      setEmail("");
      setPhone("");
      setBdiLogin("");
    }
  }, [record, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!market || !name.trim()) {
      setError("Market and Name are required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        market,
        name: name.trim(),
        title: title.trim() || null,
        ntid: ntid.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        bdi_login: bdiLogin.trim() || null,
      };

      if (record) {
        await apiFetch(`/api/mm-dm/${record.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/mm-dm", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to save directory record.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="px-6 py-4 bg-purple-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Contact2 className="w-5 h-5 text-purple-300" />
            <h2 className="text-base font-bold">{record ? "Edit Leader Info" : "Add Leader Info"}</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Market *</label>
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2.5 bg-white font-medium"
              >
                {MARKETS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Title / Role</label>
              <select
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2.5 bg-white font-medium"
              >
                {TITLES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Akbar Uddin"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 bg-white"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">NTID</label>
              <input
                type="text"
                placeholder="e.g. nkp62314"
                value={ntid}
                onChange={(e) => setNtid(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 bg-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Email</label>
              <input
                type="email"
                placeholder="leader@technocomm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                placeholder="(602) 555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">BDI Login</label>
            <input
              type="text"
              placeholder="e.g. user@bdilogin.com"
              value={bdiLogin}
              onChange={(e) => setBdiLogin(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-2 bg-white font-mono"
            />
          </div>

          <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-bold"
            >
              {submitting ? "Saving..." : record ? "Update Leader" : "Save Leader"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
