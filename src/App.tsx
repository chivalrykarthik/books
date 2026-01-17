import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import Header from './components/Header';
import Library from './pages/Library';
import BookDetails from './pages/BookDetails';
import Reader from './pages/Reader';
import Login from './pages/Login';
import './index.css';

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();

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
