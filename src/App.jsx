import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import SettingsPanel from './components/SettingsPanel';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Leaderboard from './pages/Leaderboard';
import Team from './pages/Team';
import PublicProfile from './pages/PublicProfile';
import { useSkins } from './hooks/useSkins';
import './App.css';

export default function App() {
  const { ownedIds, unlockSkin } = useSkins();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <BrowserRouter>
      <div className="app">
        <div className="bg-grid" />
        <Navbar onSettings={() => setShowSettings(true)} />
        {showSettings && (
          <SettingsPanel onClose={() => setShowSettings(false)} />
        )}
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/team"        element={<Team />} />
          <Route path="/shop"        element={<Shop ownedIds={ownedIds} onUnlock={unlockSkin} />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/u/:username" element={<PublicProfile />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
