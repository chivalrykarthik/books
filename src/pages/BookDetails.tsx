import { useParams, Link } from 'react-router-dom';
import { useBook } from '../hooks/useBooks';

export default function BookDetails() {
    const { bookId } = useParams<{ bookId: string }>();
    const { book, loading, error } = useBook(bookId);

    if (loading) {
        return (
            <div className="loading">
                <div className="loading-spinner"></div>
                <p>Loading book details...</p>
            </div>
        );
    }

    if (error || !book) {
        return (
            <div className="container">
                <div className="empty-state">
                    <div className="empty-state-icon">📖</div>
                    <p>{error || 'Book not found'}</p>
                    <Link to="/" className="back-link">← Back to Library</Link>
                </div>
            </div>
        );
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
                {book.chapters.map((chapter) => {
                    const chapterNum = chapter.id.match(/\d+/)?.[0] || chapter.id;
                    return (
                        <li key={chapter.id} className="chapter-item">
                            <Link
                                to={`/book/${book.id}/chapter/${chapter.id}`}
                                className="chapter-link"
                            >
                                <span className="chapter-number">{chapterNum}</span>
                                <span className="chapter-title">{chapter.title}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </main>
    );
}
