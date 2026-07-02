import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import {
  applyOverrides,
  loadOverrides,
  ensureFont,
  familyFromStack,
} from "./theme";

const _ov = loadOverrides();
applyOverrides(_ov);
["--font", "--head-font"].forEach((k) => {
  if (_ov[k]) ensureFont(familyFromStack(_ov[k]));
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
