import { HashRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Header from './components/Header';
import Library from './pages/Library';
import BookDetails from './pages/BookDetails';
import Reader from './pages/Reader';
import Login from './pages/Login';
import './index.css';

function AppContent() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('book-theme');
    return (saved as 'light' | 'dark') || 'light';
  });
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('book-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <>
      <Header theme={theme} toggleTheme={toggleTheme} />
      <Routes>
        <Route path="/" element={<Library />} />
        <Route path="/book/:bookId" element={<BookDetails />} />
        <Route path="/book/:bookId/chapter/:chapterId" element={<Reader />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
