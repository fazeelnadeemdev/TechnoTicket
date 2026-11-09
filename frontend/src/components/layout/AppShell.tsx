"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { CreateTicketModal } from "@/components/modals/CreateTicketModal";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [createTicketOpen, setCreateTicketOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user && pathname !== "/login") {
      router.push("/login");
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-700 rounded-full animate-spin"></div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Loading Techno Communications...
          </div>
        </div>
      </div>
    );
  }

  if (!user && pathname !== "/login") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenCreateTicket={() => setCreateTicketOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Global Create Ticket Modal */}
      {createTicketOpen && (
        <CreateTicketModal
          isOpen={createTicketOpen}
          onClose={() => setCreateTicketOpen(false)}
          onSuccess={() => {
            setCreateTicketOpen(false);
            // Fire custom event to refresh tables/metrics
            window.dispatchEvent(new Event("techno:ticket-created"));
          }}
        />
      )}
    </div>
  );
};

