import { useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (login(password)) {
            setError('');
        } else {
            setError('Incorrect password');
            setPassword('');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-icon">📚</div>
                <h1>Book Summaries</h1>
                <p className="login-subtitle">Enter password to access your library</p>

                <form onSubmit={handleSubmit} className="login-form">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="login-input"
                        autoFocus
                    />
                    {error && <p className="login-error">{error}</p>}
                    <button type="submit" className="login-btn">
                        Enter Library
                    </button>
                </form>
            </div>
        </div>
    );
}
