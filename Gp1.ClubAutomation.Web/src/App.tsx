import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import ProtectedRoute from "./auth/ProtectedRoute";
import AppLayout from "./components/AppLayout";

export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute><AppLayout><Home /></AppLayout></ProtectedRoute>
        }/>
        <Route path="/profile" element={
          <ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>
        }/>
      </Routes>
    </BrowserRouter>
  );
}
