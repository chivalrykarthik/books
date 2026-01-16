export interface Chapter {
    id: string;
    title: string;
}

export interface Book {
    id: string;
    title: string;
    author: string;
    cover: string;
    description: string;
    type: string;
    chapters: Chapter[];
}
