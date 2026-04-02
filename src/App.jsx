import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import SettingsPanel from './components/SettingsPanel';
import FeedbackModal from './components/FeedbackModal';
import Landing from './pages/Landing';
import Home from './pages/Home';
import PublicProfile from './pages/PublicProfile';
import AdminSkins from './pages/AdminSkins';
import SignIn from './pages/SignIn';
import Achievements from './pages/Achievements';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import './App.css';

function AppShell({ children }) {
  const { pathname } = useLocation();
  const isFullPage = pathname === '/' || pathname === '/signin' || pathname.startsWith('/blog');
  const [showSettings, setShowSettings] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  if (isFullPage) return children;

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
            <Route path="/about"         element={<Navigate to="/" replace />} />
            <Route path="/u/:username"   element={<PublicProfile />} />
            <Route path="/admin"         element={<AdminSkins />} />
            <Route path="/signin"        element={<SignIn />} />
            <Route path="/achievements"  element={<Achievements />} />
            <Route path="/blog"          element={<Blog />} />
            <Route path="/blog/:slug"    element={<BlogPost />} />
          </Routes>
        </AppShell>
      </div>
    </BrowserRouter>
  );
}
