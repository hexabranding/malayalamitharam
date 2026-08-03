import React from "react";
import { createRoot } from "react-dom/client";
import "aos/dist/aos.css";
import "./styles.css";
import App from "./App.jsx";
import { DataProvider } from "./context/DataContext.jsx";
import { AdsProvider } from "./context/AdsContext.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DataProvider>
      <AdsProvider>
        <App />
      </AdsProvider>
    </DataProvider>
  </React.StrictMode>
);
