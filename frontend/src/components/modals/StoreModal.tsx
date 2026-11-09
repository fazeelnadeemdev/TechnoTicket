"use client";

import React, { useState, useEffect } from "react";
import { X, Store as StoreIcon, AlertCircle } from "lucide-react";
import { Store } from "@/lib/types";
import { apiFetch } from "@/lib/api";

interface StoreModalProps {
  store?: Store | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MARKETS = [
  "Arizona", "Houston", "Bay Area", "Memphis", "Philly", "Utah", "Miami", "El Paso", "Arkansas"
];

export const StoreModal: React.FC<StoreModalProps> = ({
  store,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [techId, setTechId] = useState("");
  const [market, setMarket] = useState("Arizona");
  const [doorCode, setDoorCode] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeEmail, setStoreEmail] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (store) {
      setTechId(store.tech_id);
      setMarket(store.market);
      setDoorCode(store.door_code || "");
      setStoreName(store.store_name);
      setStoreEmail(store.store_email || "");
      setStorePhone(store.store_phone || "");
      setStoreAddress(store.store_address);
    } else {
      setTechId("");
      setMarket("Arizona");
      setDoorCode("");
      setStoreName("");
      setStoreEmail("");
      setStorePhone("");
      setStoreAddress("");
    }
  }, [store, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!techId.trim() || !storeName.trim() || !storeAddress.trim()) {
      setError("Tech ID, Store Name, and Address are required.");
      return;
    }

    setSubmitting(true);
    try {
      if (store) {
        await apiFetch(`/api/stores/${store.id}`, {
          method: "PUT",
          body: JSON.stringify({
            tech_id: techId.trim(),
            market,
            door_code: doorCode.trim() || null,
            store_name: storeName.trim(),
            store_email: storeEmail.trim() || null,
            store_phone: storePhone.trim() || null,
            store_address: storeAddress.trim(),
          }),
        });
      } else {
        await apiFetch("/api/stores", {
          method: "POST",
          body: JSON.stringify({
            tech_id: techId.trim(),
            market,
            door_code: doorCode.trim() || null,
            store_name: storeName.trim(),
            store_email: storeEmail.trim() || null,
            store_phone: storePhone.trim() || null,
            store_address: storeAddress.trim(),
          }),
        });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to save store.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="px-6 py-4 bg-purple-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <StoreIcon className="w-5 h-5 text-purple-300" />
            <h2 className="text-base font-bold">{store ? "Edit Store" : "Add New Store"}</h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tech ID *</label>
              <input
                type="text"
                placeholder="e.g. Tech3458"
                value={techId}
                onChange={(e) => setTechId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2.5 font-mono"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Market *</label>
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2.5 bg-white"
              >
                {MARKETS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Door Code</label>
              <input
                type="text"
                placeholder="e.g. 70851709"
                value={doorCode}
                onChange={(e) => setDoorCode(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2.5 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Store Name *</label>
              <input
                type="text"
                placeholder="e.g. 6544 W Thomas Rd"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2.5"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Store Address *</label>
            <input
              type="text"
              placeholder="Full Street, City, State, ZIP"
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-2.5"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Store Phone</label>
              <input
                type="text"
                placeholder="(602) 555-0100"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2.5"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Store Email</label>
              <input
                type="email"
                placeholder="tech3458@techno.com"
                value={storeEmail}
                onChange={(e) => setStoreEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2.5"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
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
              {submitting ? "Saving..." : store ? "Update Store" : "Add Store"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

