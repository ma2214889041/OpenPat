import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import PublicProfile from './pages/PublicProfile';
import SignIn from './pages/SignIn';
import Chat from './pages/Chat';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/"              element={<Landing />} />
          <Route path="/app"           element={<Navigate to="/chat" replace />} />
          <Route path="/about"         element={<Navigate to="/" replace />} />
          <Route path="/u/:username"   element={<PublicProfile />} />
          <Route path="/signin"        element={<SignIn />} />
          <Route path="/chat"          element={<Chat />} />
          <Route path="/blog"          element={<Blog />} />
          <Route path="/blog/:slug"    element={<BlogPost />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
