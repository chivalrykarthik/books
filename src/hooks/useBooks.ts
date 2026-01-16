import { useState, useEffect } from 'react';
import type { Book } from '../types';

interface UseBooksResult {
    books: Book[];
    loading: boolean;
    error: string | null;
}

interface UseBookResult {
    book: Book | null;
    loading: boolean;
    error: string | null;
}

interface UseChapterResult {
    content: string;
    book: Book | null;
    loading: boolean;
    error: string | null;
}

// Fetch all books
export function useBooks(): UseBooksResult {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const res = await fetch(`${import.meta.env.BASE_URL}books/index.json`);
                if (!res.ok) throw new Error('Failed to load books');
                const data = await res.json();
                setBooks(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchBooks();
    }, []);

    return { books, loading, error };
}

// Fetch single book by ID
export function useBook(bookId: string | undefined): UseBookResult {
    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!bookId) {
            setLoading(false);
            return;
        }

        const fetchBook = async () => {
            try {
                const res = await fetch(`${import.meta.env.BASE_URL}books/index.json`);
                if (!res.ok) throw new Error('Failed to load book');
                const books: Book[] = await res.json();
                const found = books.find(b => b.id === bookId);

                if (!found) {
                    throw new Error('Book not found');
                }

                setBook(found);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchBook();
    }, [bookId]);

    return { book, loading, error };
}

// Fetch chapter content
export function useChapter(bookId: string | undefined, chapterId: string | undefined): UseChapterResult {
    const [content, setContent] = useState('');
    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!bookId || !chapterId) {
            setLoading(false);
            return;
        }

        const fetchChapter = async () => {
            try {
                // Load book metadata first
                const booksRes = await fetch(`${import.meta.env.BASE_URL}books/index.json`);
                if (!booksRes.ok) throw new Error('Failed to load book');
                const books: Book[] = await booksRes.json();
                const foundBook = books.find(b => b.id === bookId);

                if (!foundBook) {
                    throw new Error('Book not found');
                }

                setBook(foundBook);

                // Load chapter content
                const contentPath = foundBook.type === 'folder'
                    ? `${import.meta.env.BASE_URL}books/${bookId}/${chapterId}.md`
                    : `${import.meta.env.BASE_URL}books/${bookId}.md`;

                const contentRes = await fetch(contentPath);
                if (!contentRes.ok) throw new Error('Failed to load chapter');
                const text = await contentRes.text();
                setContent(text);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchChapter();
        window.scrollTo(0, 0);
    }, [bookId, chapterId]);

    return { content, book, loading, error };
}
