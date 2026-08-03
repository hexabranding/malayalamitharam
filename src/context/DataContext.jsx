import { createContext, useContext, useState, useEffect } from "react";
import { fetchSettings, loadMenuGroups } from "../services/api.js";

const DataContext = createContext({ settings: {}, menuGroups: [] });

export function DataProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [menuGroups, setMenuGroups] = useState([]);

  useEffect(() => {
    fetchSettings().then(data => { if (data && typeof data === "object") setSettings(data); }).catch(() => {});
    loadMenuGroups().then(data => { if (Array.isArray(data)) setMenuGroups(data); }).catch(() => {});

    function refresh() {
      fetchSettings().then(data => { if (data && typeof data === "object") setSettings(data); }).catch(() => {});
      loadMenuGroups().then(data => { if (Array.isArray(data)) setMenuGroups(data); }).catch(() => {});
    }
    window.addEventListener("mm-data-updated", refresh);
    return () => window.removeEventListener("mm-data-updated", refresh);
  }, []);

  return (
    <DataContext.Provider value={{ settings, menuGroups }}>
      {children}
    </DataContext.Provider>
  );
}

export function useSettings() {
  return useContext(DataContext).settings;
}

export function useMenuGroups() {
  return useContext(DataContext).menuGroups;
}
