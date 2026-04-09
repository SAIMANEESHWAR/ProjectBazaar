import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./globals.css";
import { bootAnalytics, initSentry } from "./lib/analytics";
import { configureCognitoAuth } from "./lib/cognitoOtpAuth";

bootAnalytics();
configureCognitoAuth();

window.addEventListener("storage", (e) => {
  if (e.key === "cookieConsent" && e.newValue === "all") {
    initSentry();
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
