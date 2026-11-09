"use client";

import React from "react";
import { Building, Check, X, ShieldAlert } from "lucide-react";

interface DepartmentSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: string[];
  activeDepartment: string;
  onSelectDepartment: (dept: string) => void;
  userName?: string;
}

const ALL_DEPARTMENTS = [
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

export const DepartmentSelectModal: React.FC<DepartmentSelectModalProps> = ({
  isOpen,
  onClose,
  departments,
  activeDepartment,
  onSelectDepartment,
  userName,
}) => {
  if (!isOpen) return null;

  // If user has "All" or is SuperAdmin, allow choosing from all departments
  const hasAll = departments.includes("All") || departments.includes("all");
  const availableDepts = hasAll ? ALL_DEPARTMENTS : (departments.length > 0 ? departments : ["Admin"]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-purple-900 to-purple-800 p-6 text-white text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-2 text-purple-200 shadow-inner">
            <Building className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold">Select Active Department</h2>
          <p className="text-xs text-purple-200 mt-1">
            {userName ? `Welcome back, ${userName}!` : "Choose working session"}
          </p>
          <p className="text-[11px] text-purple-300 mt-0.5">
            You hold multi-department operational access.
          </p>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-xs font-semibold text-slate-700">
            Choose your working session context:
          </div>

          <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
            {availableDepts.map((dept) => {
              const isSelected = activeDepartment === dept;
              return (
                <button
                  key={dept}
                  type="button"
                  onClick={() => {
                    onSelectDepartment(dept);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? "border-purple-600 bg-purple-50 text-purple-900 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate">{dept}</span>
                  {isSelected && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>You can switch departments anytime in the top bar.</span>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-purple-800 text-white font-bold hover:bg-purple-900"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

