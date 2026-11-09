"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ticket as TicketIcon,
  UserCheck,
  Users,
  Building2,
  ChevronDown,
  ChevronRight,
  Store,
  Contact2,
  Home,
  Layers,
  X
} from "lucide-react";

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const pathname = usePathname();
  const [marketOpen, setMarketOpen] = useState(true);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Manage Ticket", href: "/tickets/manage", icon: Layers },
    { label: "Own Tickets", href: "/tickets/own", icon: TicketIcon },
    { label: "Assigned Tickets", href: "/tickets/assigned", icon: UserCheck },
    { label: "Agents", href: "/agents", icon: Users },
  ];

  const isMarketActive = pathname.startsWith("/market");

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 bg-gradient-to-r from-purple-900 to-purple-800 text-white shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center font-black text-lg text-purple-200 border border-white/20">
              TC
            </div>
            <div>
              <div className="font-bold text-sm tracking-wide leading-tight">TECHNO</div>
              <div className="text-[10px] text-purple-200 font-medium tracking-wider">COMMUNICATIONS LLC</div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-white/80 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1 text-sm font-medium">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Ticketing Center
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg transition-colors ${
                  active
                    ? "bg-purple-50 text-purple-800 font-semibold border-l-4 border-purple-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-purple-700" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Collapsible Market Structure */}
          <div className="pt-4">
            <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Franchise Structure
            </div>
            <button
              onClick={() => setMarketOpen(!marketOpen)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-colors ${
                isMarketActive
                  ? "bg-purple-50/70 text-purple-800 font-semibold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Building2 className={`w-5 h-5 ${isMarketActive ? "text-purple-700" : "text-slate-400"}`} />
                <span>Market Structure</span>
              </div>
              {marketOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {marketOpen && (
              <div className="ml-5 pl-3 border-l-2 border-slate-100 mt-1 space-y-1">
                <Link
                  href="/market/stores"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                    pathname === "/market/stores"
                      ? "bg-purple-100/60 text-purple-900 font-semibold"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Store className="w-4 h-4 text-purple-600" />
                  <span>Stores Directory</span>
                </Link>
                <Link
                  href="/market/mm-dm"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                    pathname === "/market/mm-dm"
                      ? "bg-purple-100/60 text-purple-900 font-semibold"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Contact2 className="w-4 h-4 text-purple-600" />
                  <span>MM / DM Info</span>
                </Link>
                <Link
                  href="/market/houses"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                    pathname === "/market/houses"
                      ? "bg-purple-100/60 text-purple-900 font-semibold"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Home className="w-4 h-4 text-purple-600" />
                  <span>Houses / Accommodations</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Franchise Badge Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 text-xs">
          <div className="flex items-center space-x-2 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium text-slate-700">Metro by T-Mobile</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Authorised Retailer Network</div>
        </div>
      </aside>
    </>
  );
};

