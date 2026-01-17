import BookCard from '../components/BookCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useBooks } from '../hooks/useBooks';

export default function Library() {
    const { books, loading, error } = useBooks();

    if (loading) {
        return <LoadingSpinner message="Loading your library..." />;
    }

    if (error) {
        return <EmptyState icon="⚠️" message={`Error: ${error}`} />;
    }

    if (books.length === 0) {
        return (
            <main className="container">
                <div className="page-title">
                    <h1>📚 My Book Library</h1>
                    <p className="page-subtitle">Summaries of books I've read</p>
                </div>
                <EmptyState message="No books found. Add some markdown summaries to get started!" />
            </main>
        );
    }

    return (
        <main className="container">
            <div className="page-title">
                <h1>📚 My Book Library</h1>
                <p className="page-subtitle">Summaries of books I've read</p>
            </div>
            <div className="book-grid">
                {books.map(book => (
                    <BookCard key={book.id} book={book} />
                ))}
            </div>
        </main>
    );
}
