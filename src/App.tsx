import { HashRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './components/Header';
import Library from './pages/Library';
import BookDetails from './pages/BookDetails';
import Reader from './pages/Reader';
import './index.css';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('book-theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('book-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <HashRouter>
      <Header theme={theme} toggleTheme={toggleTheme} />
      <Routes>
        <Route path="/" element={<Library />} />
        <Route path="/book/:bookId" element={<BookDetails />} />
        <Route path="/book/:bookId/chapter/:chapterId" element={<Reader />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
