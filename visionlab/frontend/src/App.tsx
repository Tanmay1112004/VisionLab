import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import FaceDetection from "@/pages/FaceDetection";
import FaceEyeDetection from "@/pages/FaceEyeDetection";
import FaceHandLandmarks from "@/pages/FaceHandLandmarks";
import ObjectTracking from "@/pages/ObjectTracking";
import Filters from "@/pages/Filters";
import { ScanFace, Eye, Hand, Box, Wand2, FlaskConical, Menu, X } from "lucide-react";
import { useState } from "react";

const queryClient = new QueryClient();

const MODES = [
  { path: "/",          label: "Face Detection",  icon: ScanFace, color: "text-violet-400" },
  { path: "/face-eye",  label: "Face + Eye",      icon: Eye,      color: "text-blue-400"   },
  { path: "/face-hand", label: "Face + Hand",     icon: Hand,     color: "text-emerald-400"},
  { path: "/tracking",  label: "Object Tracking", icon: Box,      color: "text-amber-400"  },
  { path: "/filters",   label: "CV Filters",      icon: Wand2,    color: "text-rose-400"   },
];

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [location] = useLocation();
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-30 flex flex-col transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
          <FlaskConical className="text-violet-400 w-7 h-7" />
          <span className="text-white font-bold text-xl tracking-tight">VisionLab</span>
          <button className="ml-auto lg:hidden text-gray-400 hover:text-white" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <p className="px-5 py-3 text-xs text-gray-500 uppercase tracking-wider font-semibold">
          Detection Modes
        </p>
        <nav className="flex-1 px-3 space-y-1">
          {MODES.map(({ path, label, icon: Icon, color }) => {
            const active = location === path;
            return (
              <Link
                key={path}
                href={path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                }`}
              >
                <Icon size={18} className={active ? color : ""} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-gray-800">
          <p className="text-xs text-gray-600">Powered by OpenCV + MediaPipe</p>
        </div>
      </aside>
    </>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white">
            <Menu size={22} />
          </button>
          <FlaskConical className="text-violet-400 w-5 h-5" />
          <span className="font-bold text-white">VisionLab</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/"           component={FaceDetection}     />
        <Route path="/face-eye"   component={FaceEyeDetection}  />
        <Route path="/face-hand"  component={FaceHandLandmarks} />
        <Route path="/tracking"   component={ObjectTracking}    />
        <Route path="/filters"    component={Filters}           />
      </Switch>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}
