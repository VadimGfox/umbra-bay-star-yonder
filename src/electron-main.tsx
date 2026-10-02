import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GarageApp } from "@/components/garage/app";
import "@/styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("root");

createRoot(root).render(
  <StrictMode>
    <GarageApp />
  </StrictMode>,
);
