import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import SettingsPanel from './components/SettingsPanel';
import FeedbackModal from './components/FeedbackModal';
import Landing from './pages/Landing';
import Home from './pages/Home';
import PublicProfile from './pages/PublicProfile';
import AdminSkins from './pages/AdminSkins';
import SignIn from './pages/SignIn';
import Achievements from './pages/Achievements';
import './App.css';

function AppShell({ children }) {
  const { pathname } = useLocation();
  const isLanding = pathname === '/';
  const isSignIn  = pathname === '/signin';
  const [showSettings, setShowSettings] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  if (isLanding || isSignIn) return children;

  return (
    <>
      <div className="bg-grid" />
      <Navbar
        onSettings={() => setShowSettings(true)}
        onFeedback={() => setShowFeedback(true)}
      />
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      {children}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <AppShell>
          <Routes>
            <Route path="/"              element={<Landing />} />
            <Route path="/app"           element={<Home />} />
            <Route path="/u/:username"   element={<PublicProfile />} />
            <Route path="/admin"         element={<AdminSkins />} />
            <Route path="/signin"        element={<SignIn />} />
            <Route path="/achievements"  element={<Achievements />} />
          </Routes>
        </AppShell>
      </div>
    </BrowserRouter>
  );
}
