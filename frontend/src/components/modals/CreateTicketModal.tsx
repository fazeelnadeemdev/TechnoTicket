"use client";

import React, { useState, useEffect } from "react";
import { X, Upload, FileText, Image as ImageIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Store, House } from "@/lib/types";
import { apiFetch } from "@/lib/api";

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MARKETS = [
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

const CATEGORIES = [
  "Deposit", "Commission", "Loomis", "Brinks", "Accounting", "Travel",
  "Supplies", "Electricity", "Alarm", "Internet", "Dumpster", "Water",
  "Gas", "Maintenance", "Phones", "RMA", "Ordering", "Codes", "IT",
  "HR", "Escalation", "Management"
];

const CATEGORY_DEPARTMENT_MAP: Record<string, string> = {
  Electricity: "Maintenance",
  Water: "Maintenance",
  Gas: "Maintenance",
  Maintenance: "Maintenance",
  Dumpster: "Maintenance",
  Alarm: "Admin",
  Codes: "Admin",
  Travel: "Admin",
  IT: "IT",
  Phones: "IT",
  Internet: "IT",
  Ordering: "Ordering",
  Supplies: "Ordering",
  RMA: "Ordering",
  Accounting: "Accounting",
  Deposit: "Accounting",
  Commission: "Accounting",
  Loomis: "Accounting",
  Brinks: "Accounting",
  HR: "HR",
  Escalation: "Management",
  Management: "Management",
};

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, activeDepartment } = useAuth();

  const [marketsList, setMarketsList] = useState<string[]>([]);
  const [market, setMarket] = useState("ARIZONA");
  const [locationType, setLocationType] = useState<"Store" | "House">("Store");
  const [selectedStoreId, setSelectedStoreId] = useState<number | "">("");
  const [selectedHouseId, setSelectedHouseId] = useState<number | "">("");
  const [category, setCategory] = useState("Electricity");
  const [department, setDepartment] = useState("Maintenance");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [description, setDescription] = useState("");

  const [stores, setStores] = useState<Store[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // File uploads
  const [images, setImages] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<{ name: string; url: string; size?: number }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch unique markets dynamically
  useEffect(() => {
    if (!isOpen) return;
    const loadMarkets = async () => {
      try {
        const m = await apiFetch<string[]>("/api/tickets/markets");
        if (m && m.length > 0) {
          setMarketsList(m);
          setMarket(m[0]);
        }
      } catch (err) {
        console.error("Failed to load markets", err);
      }
    };
    loadMarkets();
  }, [isOpen]);

  // Fetch stores & houses for selected market
  useEffect(() => {
    if (!isOpen || !market) return;
    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        const [storesData, housesData] = await Promise.all([
          apiFetch<Store[]>(`/api/stores?market=${encodeURIComponent(market)}`),
          apiFetch<House[]>(`/api/houses?market=${encodeURIComponent(market)}`),
        ]);
        setStores(storesData);
        setHouses(housesData);

        if (storesData.length > 0) {
          setSelectedStoreId(storesData[0].id);
        } else {
          setSelectedStoreId("");
        }
        if (housesData.length > 0) {
          setSelectedHouseId(housesData[0].id);
        } else {
          setSelectedHouseId("");
        }
      } catch (err) {
        console.error("Failed to load stores/houses", err);
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, [market, isOpen]);

  // Suggest department automatically when category changes
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    if (CATEGORY_DEPARTMENT_MAP[newCat]) {
      setDepartment(CATEGORY_DEPARTMENT_MAP[newCat]);
    }
  };

  // Image Upload handler with client compression preview
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) {
          setUploadError("Only image files (PNG, JPG, JPEG) are allowed in Image upload.");
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await apiFetch<{ url: string; filename: string }>("/api/upload", {
          method: "POST",
          body: formData,
        });
        setImages((prev) => [...prev, res.url]);
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  // Document / Spreadsheet / Video attachments handler
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          setUploadError(`File ${file.name} exceeds 5MB maximum limit.`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await apiFetch<{ url: string; filename: string; size: number }>("/api/upload", {
          method: "POST",
          body: formData,
        });

        setAttachments((prev) => [
          ...prev,
          { name: file.name, url: res.url, size: file.size },
        ]);
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload attachment");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!description.trim()) {
      setFormError("Please enter a ticket description.");
      return;
    }

    setSubmitting(true);
    try {
      let locationDisplay = "";
      let storeIdNum: number | undefined = undefined;
      let houseIdNum: number | undefined = undefined;

      if (locationType === "Store") {
        const foundStore = stores.find((s) => s.id === selectedStoreId);
        storeIdNum = foundStore?.id;
        locationDisplay = foundStore
          ? `[${foundStore.tech_id}] ${foundStore.store_name} — ${foundStore.store_address}${foundStore.door_code ? ` (Door: ${foundStore.door_code})` : ""}`
          : `Store (${market})`;
      } else {
        const foundHouse = houses.find((h) => h.id === selectedHouseId);
        houseIdNum = foundHouse?.id;
        locationDisplay = foundHouse
          ? `[${foundHouse.house_code || "HOUSE"}] ${foundHouse.address}${foundHouse.lease_holders ? ` — ${foundHouse.lease_holders}` : ""} (${foundHouse.status})`
          : `House (${market})`;
      }

      await apiFetch("/api/tickets", {
        method: "POST",
        body: JSON.stringify({
          market,
          location_type: locationType,
          store_id: storeIdNum,
          house_id: houseIdNum,
          location_display: locationDisplay,
          category,
          department,
          priority,
          description: description.trim(),
          images,
          attachments,
        }),
      });

      onSuccess();
    } catch (err: any) {
      setFormError(err.message || "Failed to create ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-900 to-purple-800 text-white flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold">Create New Ticket</h2>
            <p className="text-xs text-purple-200">Techno Communications LLC - Franchise Support</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Auto-populated Creator Info */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Creator</span>
              <span className="font-semibold text-slate-800">{user?.name || "Admin"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email</span>
              <span className="font-medium text-slate-600 truncate block">{user?.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
              <span className="font-medium text-slate-600">{user?.phone || "(602) 555-0100"}</span>
            </div>
          </div>

          {/* Market & Location Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Market</label>
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
              >
                {(marketsList.length > 0 ? marketsList : MARKETS).map((m) => (
                  <option key={m} value={m}>
                    {m} Market
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Please Select One?
              </label>
              <div className="flex items-center space-x-4 pt-1.5 text-xs font-medium">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="locationType"
                    checked={locationType === "Store"}
                    onChange={() => setLocationType("Store")}
                    className="text-purple-700 focus:ring-purple-600"
                  />
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                    <span>Stores</span>
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="locationType"
                    checked={locationType === "House"}
                    onChange={() => setLocationType("House")}
                    className="text-purple-700 focus:ring-purple-600"
                  />
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Houses</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Dynamic Stores or Houses Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {locationType === "Store" ? "Select Store" : "Select Corporate House"}
            </label>
            {loadingLocations ? (
              <div className="text-xs text-slate-400 py-2">Loading locations...</div>
            ) : locationType === "Store" ? (
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(Number(e.target.value))}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.tech_id}] {s.store_name} — {s.store_address}{s.door_code ? ` (Door: ${s.door_code})` : ""}
                  </option>
                ))}
                {stores.length === 0 && (
                  <option value="">No stores registered in {market}</option>
                )}
              </select>
            ) : (
              <select
                value={selectedHouseId}
                onChange={(e) => setSelectedHouseId(Number(e.target.value))}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
              >
                {houses.map((h) => (
                  <option key={h.id} value={h.id}>
                    [{h.house_code || "HOUSE"}] {h.address}{h.lease_holders ? ` — ${h.lease_holders}` : ""} ({h.status})
                  </option>
                ))}
                {houses.length === 0 && (
                  <option value="">No corporate houses registered in {market}</option>
                )}
              </select>
            )}
          </div>

          {/* Category, Department, Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
              >
                <option value="Admin">Admin</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Ordering">Ordering</option>
                <option value="Accounting">Accounting</option>
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="RMA">RMA</option>
                <option value="Escalation">Escalation</option>
                <option value="Management">Management</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the issue, requirements, affected equipment, or store needs..."
              className="w-full text-xs rounded-xl border border-slate-200 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 placeholder:text-slate-400"
              required
            />
          </div>

          {/* Upload Dropzones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Image Dropzone */}
            <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50/70 text-center hover:bg-slate-50 transition-colors">
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <ImageIcon className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                <span className="text-xs font-semibold text-slate-700 block">Upload Images</span>
                <span className="text-[10px] text-slate-400 block">PNG, JPG, JPEG</span>
              </label>
              {images.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
                  {images.map((img, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1 text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-medium"
                    >
                      <span>Image {idx + 1}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Document / Video Dropzone */}
            <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50/70 text-center hover:bg-slate-50 transition-colors">
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.mp4,.mov,.avi"
                  multiple
                  onChange={handleAttachmentUpload}
                  className="hidden"
                />
                <Upload className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                <span className="text-xs font-semibold text-slate-700 block">Upload Attachments</span>
                <span className="text-[10px] text-slate-400 block">PDF, DOC, XLS, MP4 (Max 5MB)</span>
              </label>
              {attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
                  {attachments.map((att, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center space-x-1 text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-medium truncate max-w-[140px]"
                    >
                      <FileText className="w-2.5 h-2.5" />
                      <span className="truncate">{att.name}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {uploadError && (
            <div className="text-[11px] text-red-600 text-center font-medium">{uploadError}</div>
          )}

          {/* Footer Submit Buttons */}
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
              disabled={submitting || isUploading}
              className="px-5 py-2.5 rounded-xl bg-purple-800 hover:bg-purple-900 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center space-x-2"
            >
              {submitting ? (
                <span>Submitting Ticket...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

