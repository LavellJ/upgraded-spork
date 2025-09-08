import { useEffect, useState } from "react";
import { pingHealth } from "@/lib/api";

export default function DebugDashboard() {
  const [msg, setMsg] = useState("checking…");
  
  useEffect(() => {
    pingHealth()
      .then(d => setMsg(`ok:${d.ok} ts:${d.ts}`))
      .catch(e => setMsg(`error: ${String(e.message || e)}`));
  }, []);
  
  return (
    <div style={{ padding: 16 }}>
      <h1>Debug</h1>
      <div>MODE: {import.meta.env.MODE}</div>
      <div>VITE_API_URL: {import.meta.env.VITE_API_URL || "(not set)"}</div>
      <div>Health: {msg}</div>
    </div>
  );
}