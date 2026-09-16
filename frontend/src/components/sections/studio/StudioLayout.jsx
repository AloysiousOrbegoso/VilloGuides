import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { api } from "../../../lib/api";
import { useColorMode } from "../../../lib/theme";
import { Sidebar } from "./Sidebar";

const StudioContext = createContext({ stats: null, refreshStats: () => {} });
export const useStudio = () => useContext(StudioContext);

/** studio.villoguides.com shell: charcoal sidebar and a working area (design principle 3). */
export function StudioLayout() {
  useColorMode();
  const [stats, setStats] = useState(null);
  const refreshStats = useCallback(() => {
    api.getStudioStats().then(setStats, () => {});
  }, []);
  useEffect(() => {
    refreshStats();
    document.title = "Studio, Villo Guides";
  }, [refreshStats]);

  return (
    <StudioContext.Provider value={{ stats, refreshStats }}>
      <div className="grid grid-cols-[216px_minmax(0,1fr)] h-screen min-h-[640px]">
        <Sidebar stats={stats} />
        <div className="flex flex-col min-w-0 min-h-0">
          <Outlet />
        </div>
      </div>
    </StudioContext.Provider>
  );
}

/** Scrolling content area under the header, with the standard page padding. */
export function StudioBody({ children, narrow = false }) {
  return (
    <div className="flex-1 overflow-auto">
      <div className={`px-8 py-8 ${narrow ? "max-w-3xl" : ""}`}>{children}</div>
    </div>
  );
}
