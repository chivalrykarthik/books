import { useParams, Link } from 'react-router-dom';
import { useBook, getChapterNumber } from '../hooks/useBooks';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function BookDetails() {
    const { bookId } = useParams<{ bookId: string }>();
    const { book, loading, error } = useBook(bookId);

    if (loading) {
        return <LoadingSpinner message="Loading book details..." />;
    }

    if (error || !book) {
        return <EmptyState message={error || 'Book not found'} showBackLink />;
    }

    return (
        <main className="container">
            <Link to="/" className="back-link">← Back to Library</Link>

            <div className="book-header">
                <div className="book-cover-large">{book.cover}</div>
                <div className="book-info">
                    <h1>{book.title}</h1>
                    <p className="book-author">by {book.author}</p>
                    <p className="book-description">{book.description}</p>
                </div>
            </div>

            <h2>Chapters</h2>
            <ul className="chapter-list">
                {book.chapters.map((chapter) => (
                    <li key={chapter.id} className="chapter-item">
                        <Link
                            to={`/book/${book.id}/chapter/${chapter.id}`}
                            className="chapter-link"
                        >
                            <span className="chapter-number">{getChapterNumber(chapter.id)}</span>
                            <span className="chapter-title">{chapter.title}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </main>
    );
}
