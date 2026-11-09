"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Store } from "@/lib/types";
import { apiFetch } from "@/lib/api";
import {
  Store as StoreIcon,
  Search,
  Plus,
  Edit2,
  Trash2,
  Key,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from "lucide-react";
import { StoreModal } from "@/components/modals/StoreModal";

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [markets, setMarkets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [marketFilter, setMarketFilter] = useState("All Markets");
  const [search, setSearch] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

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

  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        market: marketFilter === "All Markets" ? "" : marketFilter,
        search: search.trim(),
      });
      const data = await apiFetch<Store[]>(`/api/stores?${params.toString()}`);
      setStores(data);
    } catch (err) {
      console.error("Failed to load stores", err);
    } finally {
      setLoading(false);
    }
  }, [marketFilter, search]);

  useEffect(() => {
    fetchStores();
    setCurrentPage(1);
  }, [fetchStores]);

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingStore(null);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this store record?")) return;
    try {
      await apiFetch(`/api/stores/${id}`, { method: "DELETE" });
      fetchStores();
    } catch (err: any) {
      alert(err.message || "Failed to delete store");
    }
  };

  const handleReset = () => {
    setMarketFilter("All Markets");
    setSearch("");
  };

  // Pagination slice
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = stores.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(stores.length / rowsPerPage) || 1;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <StoreIcon className="w-5 h-5 text-purple-700" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Stores Directory</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Metro by T-Mobile US Authorized Retailer Network ({stores.length} franchise locations)
            </p>
          </div>

          <button
            onClick={handleAdd}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-800 hover:bg-purple-900 text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>ADD NEW STORE</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-500">Market:</span>
              <select
                value={marketFilter}
                onChange={(e) => setMarketFilter(e.target.value)}
                className="rounded-xl border border-slate-200 p-2 bg-slate-50 focus:bg-white font-medium max-w-[200px]"
              >
                <option value="All Markets">All Markets</option>
                {markets.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleReset}
              className="flex items-center space-x-1 p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          </div>

          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search tech ID, store name, DM, door code..."
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
                  <th className="py-3 px-4">BDI ID (Tech ID)</th>
                  <th className="py-3 px-3">Store Name</th>
                  <th className="py-3 px-3">Market</th>
                  <th className="py-3 px-3">DM Name</th>
                  <th className="py-3 px-3">Door Code</th>
                  <th className="py-3 px-4 min-w-[220px]">Address</th>
                  <th className="py-3 px-3">Store Phone</th>
                  <th className="py-3 px-3">Store Email</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      <div className="inline-block w-6 h-6 border-2 border-purple-300 border-t-purple-700 rounded-full animate-spin mb-2" />
                      <div>Loading stores...</div>
                    </td>
                  </tr>
                ) : currentRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      No stores found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  currentRows.map((s) => (
                    <tr key={s.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-purple-900 whitespace-nowrap">{s.tech_id}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">{s.store_name}</td>
                      <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">{s.market}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">{s.dm_name || "—"}</td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-600 whitespace-nowrap">
                        {s.door_code ? (
                          <span className="flex items-center space-x-1 bg-slate-100 px-2 py-0.5 rounded text-[11px] w-fit font-bold text-slate-800">
                            <Key className="w-3 h-3 text-amber-600" />
                            <span>{s.door_code}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>{s.store_address}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {s.store_phone || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-3 px-3 text-purple-700 font-medium whitespace-nowrap">
                        {s.store_email ? (
                          <a href={`mailto:${s.store_email}`} className="hover:underline">
                            {s.store_email}
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleEdit(s)}
                            className="p-1 rounded text-slate-400 hover:text-purple-700 hover:bg-purple-50"
                            title="Edit Store"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-700 hover:bg-red-50"
                            title="Delete Store"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing <span className="font-bold text-slate-800">{stores.length === 0 ? 0 : indexOfFirstRow + 1}</span> to{" "}
              <span className="font-bold text-slate-800">{Math.min(indexOfLastRow, stores.length)}</span> of{" "}
              <span className="font-bold text-slate-800">{stores.length}</span> stores
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

      {modalOpen && (
        <StoreModal
          store={editingStore}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            fetchStores();
          }}
        />
      )}
    </AppShell>
  );
}
