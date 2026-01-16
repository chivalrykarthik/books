import { Link } from 'react-router-dom';

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export default function Header({ theme, toggleTheme }: HeaderProps) {
    return (
        <header className="header">
            <div className="header-content">
                <Link to="/" className="logo">
                    📖 Book Summaries
                </Link>
                <button
                    className="theme-toggle"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>
            </div>
        </header>
    );
}
