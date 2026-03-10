import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Plus, Users, ListChecks, BarChart3,
  Menu, X, Bell, ChevronDown, LogOut, Settings, ArrowLeft, Home
} from "lucide-react";
import { cn } from "@/lib/utils";

// Real Firebase import
import { db } from "./firebase"; 

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { label: "New Task", icon: Plus, page: "NewTask" },
  { label: "Live Tasks", icon: ListChecks, page: "LiveTasks" },
  { label: "Clients", icon: Users, page: "Clients" },
  { label: "Reports", icon: BarChart3, page: "Reports" },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Standard placeholder until Firebase Auth is fully implemented
    setUser({ full_name: "Admin", role: "Manager" });
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex">
      <style>{`
        :root {
          --primary: #1E3A5F;
          --accent: #2E86AB;
          --gold: #C9A84C;
          --success: #22C55E;
          --warning: #F59E0B;
          --danger: #EF4444;
        }
        * { font-family: 'Inter', system-ui, sans-serif; }
      `}</style>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[#1E3A5F] flex flex-col transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0 lg:static lg:flex"
      )}>
        {/* Logo Section */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#51AE3A] flex items-center justify-center">
              <span className="text-white font-bold text-sm">FW</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">FideloOps</p>
              <p className="text-white/50 text-xs">Client Service Hub</p>
            </div>
          </div>
        </div>

        {/* Navigation Buttons Area */}
        <div className="px-3 pt-4 pb-2 space-y-2">
          {/* Go Back to Main Site */}
          <button 
            onClick={() => {
              window.location.href = "https://adi4real.github.io/Fidelo_Main/";
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all border border-white/5"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
</div>
        {/* Main App Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">
            Main Menu
          </div>
          {navItems.map(({ label, icon: Icon, page }) => {
            const active = currentPageName === page;
            return (
              <Link
                key={page}
                to={createPageUrl(page)}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-[#00765B] text-white shadow-lg"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        {user && (
          <div className="px-4 py-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#51AE3A]/30 flex items-center justify-center">
                <span className="text-[#51AE3A] text-xs font-bold">
                  {user.full_name?.[0] || "A"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{user.full_name}</p>
                <p className="text-white/40 text-xs capitalize">{user.role}</p>
              </div>
              <button className="text-white/40 hover:text-white">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-4 sticky top-0 z-30">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-gray-500 hidden sm:block">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}