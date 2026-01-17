import { Link } from 'react-router-dom';

interface EmptyStateProps {
    icon?: string;
    message: string;
    showBackLink?: boolean;
}

export default function EmptyState({
    icon = '📖',
    message,
    showBackLink = false
}: EmptyStateProps) {
    return (
        <div className="container">
            <div className="empty-state">
                <div className="empty-state-icon">{icon}</div>
                <p>{message}</p>
                {showBackLink && (
                    <Link to="/" className="back-link">← Back to Library</Link>
                )}
            </div>
        </div>
    );
}
