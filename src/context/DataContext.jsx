import { createContext, useContext, useState, useEffect } from "react";
import { fetchSettings, loadMenuGroups } from "../services/api.js";

const DataContext = createContext({ settings: {}, menuGroups: [] });

export function DataProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [menuGroups, setMenuGroups] = useState([]);

  useEffect(() => {
    fetchSettings().then(setSettings).catch(() => {});
    loadMenuGroups().then(setMenuGroups).catch(() => {});

    function refresh() {
      fetchSettings().then(setSettings).catch(() => {});
      loadMenuGroups().then(setMenuGroups).catch(() => {});
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
