import { Link } from 'react-router-dom';
import type { Book } from '../types';

interface BookCardProps {
    book: Book;
}

export default function BookCard({ book }: BookCardProps) {
    return (
        <Link to={`/book/${book.id}`} className="book-card">
            <div className="book-cover">{book.cover}</div>
            <h3>{book.title}</h3>
            <p className="book-author">{book.author}</p>
            <p className="book-description">{book.description}</p>
            <div className="meta">
                <span>📑 {book.chapters.length} {book.chapters.length === 1 ? 'chapter' : 'chapters'}</span>
            </div>
        </Link>
    );
}
