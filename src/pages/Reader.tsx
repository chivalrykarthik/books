import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import { useChapter } from '../hooks/useBooks';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function Reader() {
    const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>();
    const navigate = useNavigate();
    const { content, book, loading, error } = useChapter(bookId, chapterId);
    const [progress, setProgress] = useState(0);

    const handleScroll = useCallback(() => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrolled = window.scrollY;
        const percentage = documentHeight > 0 ? (scrolled / documentHeight) * 100 : 0;
        setProgress(Math.min(percentage, 100));
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const currentIndex = book?.chapters.findIndex(c => c.id === chapterId) ?? -1;
    const prevChapter = currentIndex > 0 ? book?.chapters[currentIndex - 1] : null;
    const nextChapter = book && currentIndex < book.chapters.length - 1
        ? book.chapters[currentIndex + 1]
        : null;
    const currentChapter = book?.chapters[currentIndex];

    if (loading) {
        return <LoadingSpinner message="Loading chapter..." />;
    }

    if (error || !book || !content) {
        return <EmptyState message={error || 'Chapter not found'} showBackLink />;
    }

    return (
        <>
            <div className="reading-progress" style={{ width: `${progress}%` }} />

            <main className="reader-container">
                <nav className="breadcrumb">
                    <Link to="/">Library</Link>
                    <span>/</span>
                    <Link to={`/book/${bookId}`}>{book.title}</Link>
                    <span>/</span>
                    <span>{currentChapter?.title}</span>
                </nav>

                <article className="markdown-content">
                    <Markdown>{content}</Markdown>
                </article>

                <nav className="chapter-nav">
                    <button
                        className="nav-btn"
                        onClick={() => prevChapter && navigate(`/book/${bookId}/chapter/${prevChapter.id}`)}
                        disabled={!prevChapter}
                    >
                        ← Previous
                    </button>

                    <Link to={`/book/${bookId}`} className="nav-btn">
                        📑 All Chapters
                    </Link>
                    <button
                        className="nav-btn"
                        onClick={() => nextChapter && navigate(`/book/${bookId}/chapter/${nextChapter.id}`)}
                        disabled={!nextChapter}
                    >
                        Next →
                    </button>
                </nav>
            </main>
        </>
    );
}
