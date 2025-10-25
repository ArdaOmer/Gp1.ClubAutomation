import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Clubs from "./pages/Clubs";
import ClubEvents from "./pages/ClubEvents";
import Certificates from "./pages/Certificates";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import NotFound from "./pages/NotFound";

import ProtectedRoute from "./auth/ProtectedRoute";
import AppLayout from "./components/AppLayout";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Home />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Profile />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/clubs"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Clubs />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/clubs/:id/events"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ClubEvents />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/certificates"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Certificates />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/announcements"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AnnouncementsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* 404 en sonda */}
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <AppLayout>
                <NotFound />
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
