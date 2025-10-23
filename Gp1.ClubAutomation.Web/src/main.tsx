import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";


import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth/AuthContext";
import { ToastProvider } from "./components/Toast"; // <-- EKLİ
import { ThemeProvider } from "./theme/ThemeContext";


const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
   <ThemeProvider>
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>             {/* <-- App mutlaka bunun içinde */}
          <App />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
  </ThemeProvider>
);
