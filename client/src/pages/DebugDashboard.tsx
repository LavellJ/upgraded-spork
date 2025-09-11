import { useEffect, useState } from "react";
import { pingHealth } from "@/lib/api";
import { DevSettings } from "../components/DevSettings";
import { HealthBadge } from "../components/HealthBadge";

export default function DebugDashboard() {
  const [msg, setMsg] = useState("checking…");
  
  useEffect(() => {
    pingHealth()
      .then(d => setMsg(`ok:${d.ok} ts:${d.ts}`))
      .catch(e => setMsg(`error: ${String(e.message || e)}`));
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.location.href = path;
  };
  
  return (
    <div style={{ padding: 16 }}>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Debug Dashboard</h1>
        <HealthBadge />
      </div>
      
      <div className="space-y-4 mb-6">
        <div>MODE: {import.meta.env.MODE}</div>
        <div>VITE_API_URL: {import.meta.env.VITE_API_URL || "(not set)"}</div>
        <div>Health: {msg}</div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Navigation</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/')}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            data-testid="nav-home"
          >
            Home
          </button>
          <button 
            onClick={() => navigate('/referrals')}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            data-testid="nav-referrals"
          >
            Referrals
          </button>
        </div>
      </div>

      <DevSettings />
    </div>
  );
}