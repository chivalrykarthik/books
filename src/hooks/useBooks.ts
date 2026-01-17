import { useState, useEffect } from 'react';
import type { Book } from '../types';

// Shared fetch function for books index
async function fetchBooksIndex(): Promise<Book[]> {
    const res = await fetch(`${import.meta.env.BASE_URL}books/index.json`);
    if (!res.ok) throw new Error('Failed to load books');
    return res.json();
}

// Shared error handler
function getErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : 'Unknown error';
}

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
        fetchBooksIndex()
            .then(setBooks)
            .catch(err => setError(getErrorMessage(err)))
            .finally(() => setLoading(false));
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

        fetchBooksIndex()
            .then(books => {
                const found = books.find(b => b.id === bookId);
                if (!found) throw new Error('Book not found');
                setBook(found);
            })
            .catch(err => setError(getErrorMessage(err)))
            .finally(() => setLoading(false));
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

        const loadChapter = async () => {
            const books = await fetchBooksIndex();
            const foundBook = books.find(b => b.id === bookId);

            if (!foundBook) throw new Error('Book not found');
            setBook(foundBook);

            const contentPath = foundBook.type === 'folder'
                ? `${import.meta.env.BASE_URL}books/${bookId}/${chapterId}.md`
                : `${import.meta.env.BASE_URL}books/${bookId}.md`;

            const contentRes = await fetch(contentPath);
            if (!contentRes.ok) throw new Error('Failed to load chapter');

            setContent(await contentRes.text());
        };

        loadChapter()
            .catch(err => setError(getErrorMessage(err)))
            .finally(() => setLoading(false));

        window.scrollTo(0, 0);
    }, [bookId, chapterId]);

    return { content, book, loading, error };
}

// Utility to extract chapter number from ID
export function getChapterNumber(chapterId: string): string {
    return chapterId.match(/\d+/)?.[0] || chapterId;
}
