import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./globals.css";
import { bootAnalytics } from "./lib/analytics";

bootAnalytics();

window.addEventListener("storage", (e) => {
  if (e.key === "cookieConsent" && e.newValue === "all") {
    bootAnalytics();
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
