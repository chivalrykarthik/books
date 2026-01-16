import BookCard from '../components/BookCard';
import { useBooks } from '../hooks/useBooks';

export default function Library() {
    const { books, loading, error } = useBooks();

    if (loading) {
        return (
            <div className="loading">
                <div className="loading-spinner"></div>
                <p>Loading your library...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container">
                <div className="empty-state">
                    <div className="empty-state-icon">⚠️</div>
                    <p>Error: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <main className="container">
            <div className="page-title">
                <h1>📚 My Book Library</h1>
                <p className="page-subtitle">Summaries of books I've read</p>
            </div>

            {books.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📖</div>
                    <p>No books found. Add some markdown summaries to get started!</p>
                </div>
            ) : (
                <div className="book-grid">
                    {books.map(book => (
                        <BookCard key={book.id} book={book} />
                    ))}
                </div>
            )}
        </main>
    );
}
