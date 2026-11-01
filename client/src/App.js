import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import SafeGoogleMapsWrapper from "./components/SafeGoogleMapsWrapper";
import { pingServer } from "./services/api";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateMatch from "./pages/CreateMatch";
import MatchDetails from "./pages/MatchDetails";
import Profile from "./pages/Profile";
import Friends from "./pages/Friends";
import MapView from "./pages/MapView";
import SportSelection from "./pages/SportSelection";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import DMInbox from "./pages/DMInbox";
import DMChat from "./pages/DMChat";
import InviteNotification from "./components/InviteNotification";
import ActivityFeed from "./pages/ActivityFeed";
import TournamentList from "./pages/TournamentList";
import TournamentDetails from "./pages/TournamentDetails";
import CreateTournament from "./pages/CreateTournament";

function App() {
  useEffect(() => {
    pingServer();
  }, []);

  return (
    <ThemeProvider>
      <SafeGoogleMapsWrapper>
        <BrowserRouter>
          <Navbar />
          <InviteNotification />
          <main className="w-full min-h-screen">
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected App Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-match"
                element={
                  <ProtectedRoute>
                    <CreateMatch />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/match/:id"
                element={
                  <ProtectedRoute>
                    <MatchDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:id"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/friends"
                element={
                  <ProtectedRoute>
                    <Friends />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/map"
                element={
                  <ProtectedRoute>
                    <MapView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/select-sports"
                element={
                  <ProtectedRoute>
                    <SportSelection />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dm"
                element={
                  <ProtectedRoute>
                    <DMInbox />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dm/:friendId"
                element={
                  <ProtectedRoute>
                    <DMChat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activity"
                element={
                  <ProtectedRoute>
                    <ActivityFeed />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tournaments"
                element={
                  <ProtectedRoute>
                    <TournamentList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tournaments/create"
                element={
                  <ProtectedRoute>
                    <CreateTournament />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tournaments/:id"
                element={
                  <ProtectedRoute>
                    <TournamentDetails />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </BrowserRouter>
      </SafeGoogleMapsWrapper>
    </ThemeProvider>
  );
}

export default App;
