import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, basename } from 'path';

const BOOKS_DIR = 'public/books';
const OUTPUT_FILE = 'public/books/index.json';

interface Chapter {
    id: string;
    title: string;
}

interface BookMetadata {
    title?: string;
    author?: string;
    cover?: string;
    description?: string;
}

interface Book {
    id: string;
    title: string;
    author: string;
    type: 'folder' | 'file';
    cover: string;
    description: string;
    chapters: Chapter[];
}

// Extract title from markdown file (first # heading)
function extractTitleFromMd(filePath: string): string {
    try {
        const content = readFileSync(filePath, 'utf-8');
        const match = content.match(/^#\s+(.+)$/m);
        return match ? match[1].trim() : basename(filePath, '.md').replace(/[-_]/g, ' ');
    } catch {
        return basename(filePath, '.md').replace(/[-_]/g, ' ');
    }
}

// Extract description from markdown (first substantial paragraph)
function extractDescriptionFromMd(filePath: string): string {
    try {
        const content = readFileSync(filePath, 'utf-8');
        // Skip headings and find first paragraph with substantial content
        const lines = content.split('\n');
        let description = '';

        for (const line of lines) {
            const trimmed = line.trim();
            // Skip headings, empty lines, and list items
            if (trimmed.startsWith('#') || trimmed === '' || trimmed.startsWith('-') || trimmed.startsWith('*')) {
                continue;
            }
            // Skip very short lines
            if (trimmed.length > 50) {
                description = trimmed;
                break;
            }
        }

        // Truncate to ~150 chars
        if (description.length > 150) {
            description = description.substring(0, 147) + '...';
        }

        return description || 'Book summary';
    } catch {
        return 'Book summary';
    }
}

// Load book metadata from book.json if exists
function loadBookMetadata(bookPath: string): BookMetadata {
    const metadataPath = join(bookPath, 'book.json');
    if (existsSync(metadataPath)) {
        try {
            return JSON.parse(readFileSync(metadataPath, 'utf-8'));
        } catch {
            return {};
        }
    }
    return {};
}

// Format book/chapter ID to readable title
function formatTitle(id: string): string {
    return id
        .replace(/[-_]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, c => c.toUpperCase());
}

// Default book covers based on name or content keywords
function getBookCover(name: string, description: string): string {
    const nameLower = name.toLowerCase();
    const descLower = description.toLowerCase();

    if (nameLower.includes('habit')) return '⚛️';
    if (nameLower.includes('achievement') || descLower.includes('success')) return '🏆';
    if (nameLower.includes('relationship') || descLower.includes('relationship')) return '🤝';
    if (nameLower.includes('money') || descLower.includes('wealth')) return '💰';
    if (nameLower.includes('mind') || descLower.includes('psychology')) return '🧠';
    if (nameLower.includes('lead') || descLower.includes('leadership')) return '👔';

    return '📚';
}

// Generate books index
function generateBooksIndex(): Book[] {
    const books: Book[] = [];
    const items = readdirSync(BOOKS_DIR);

    for (const item of items) {
        if (item === 'index.json') continue;

        const itemPath = join(BOOKS_DIR, item);
        const stat = statSync(itemPath);

        if (stat.isDirectory()) {
            // Book folder with chapter files
            const files = readdirSync(itemPath)
                .filter(f => f.endsWith('.md'))
                .sort((a, b) => {
                    const numA = parseInt(a.match(/\d+/)?.[0] || '0');
                    const numB = parseInt(b.match(/\d+/)?.[0] || '0');
                    return numA - numB;
                });

            const chapters: Chapter[] = files.map(file => ({
                id: basename(file, '.md'),
                title: extractTitleFromMd(join(itemPath, file))
            }));

            if (chapters.length > 0) {
                // Load metadata or extract from first chapter
                const metadata = loadBookMetadata(itemPath);
                const firstChapterPath = join(itemPath, files[0]);
                const extractedDesc = extractDescriptionFromMd(firstChapterPath);

                const description = metadata.description || extractedDesc;

                books.push({
                    id: item,
                    title: metadata.title || formatTitle(item),
                    author: metadata.author || 'Unknown Author',
                    type: 'folder',
                    cover: metadata.cover || getBookCover(item, description),
                    description,
                    chapters
                });
            }
        } else if (item.endsWith('.md')) {
            // Single-file book
            const id = basename(item, '.md');
            const description = extractDescriptionFromMd(itemPath);

            books.push({
                id,
                title: formatTitle(id),
                author: 'Unknown Author',
                type: 'file',
                cover: getBookCover(id, description),
                description,
                chapters: [{
                    id: 'full',
                    title: 'Complete Summary'
                }]
            });
        }
    }

    return books;
}

// Main
const books = generateBooksIndex();
writeFileSync(OUTPUT_FILE, JSON.stringify(books, null, 4));
console.log(`✅ Generated ${OUTPUT_FILE} with ${books.length} book(s)`);
books.forEach(b => console.log(`   📖 ${b.title} (${b.chapters.length} chapters)`));
