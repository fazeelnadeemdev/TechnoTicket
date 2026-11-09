"use client";

import React, { useState } from "react";
import { Menu, Plus, User, LogOut, Shield, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  onOpenMobileSidebar: () => void;
  onOpenCreateTicket: () => void;
}

const DEPARTMENTS = [
  "Admin",
  "Maintenance",
  "Ordering",
  "Accounting",
  "IT",
  "HR",
  "RMA",
  "Escalation",
  "Management",
  "Compliance"
];

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileSidebar,
  onOpenCreateTicket,
}) => {
  const { user, activeDepartment, setActiveDepartment, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left side: Hamburger + Context */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Department Context Selector */}
        <div className="relative">
          <button
            onClick={() => {
              setDeptDropdownOpen(!deptDropdownOpen);
              setProfileDropdownOpen(false);
            }}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100/70 text-purple-900 transition-colors text-xs font-semibold"
          >
            <span className="text-purple-600 font-medium">Department:</span>
            <span className="bg-purple-700 text-white px-2 py-0.5 rounded text-[11px]">
              {activeDepartment}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-purple-700" />
          </button>

          {deptDropdownOpen && (
            <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Switch Department Context
              </div>
              {DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  onClick={() => {
                    setActiveDepartment(dept);
                    setDeptDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                    activeDepartment === dept
                      ? "bg-purple-50 text-purple-800 font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span>{dept}</span>
                  {activeDepartment === dept && (
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-700"></span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Action + Profile */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Create Ticket Button */}
        <button
          onClick={onOpenCreateTicket}
          className="flex items-center space-x-1.5 sm:space-x-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-purple-800 to-purple-700 hover:from-purple-900 hover:to-purple-800 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all transform active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>CREATE NEW TICKET</span>
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileDropdownOpen(!profileDropdownOpen);
              setDeptDropdownOpen(false);
            }}
            className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-300 flex items-center justify-center text-purple-800 font-bold text-xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "TC"}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.name || "Techno Admin"}
              </div>
              <div className="text-[10px] text-purple-700 font-medium">
                {user?.role || "Admin"} • {user?.team_type || "Internal"}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900">{user?.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
                <div className="mt-1.5 inline-flex items-center space-x-1 text-[10px] font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  <Shield className="w-3 h-3" />
                  <span>{user?.role}</span>
                  <span>({user?.team_type})</span>
                </div>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

