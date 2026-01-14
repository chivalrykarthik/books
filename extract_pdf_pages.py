
import sys
from pypdf import PdfReader

def extract_range(pdf_path, start_page, end_page, output_file):
    """
    Extracts text from a PDF within a given page range (1-based).
    """
    try:
        reader = PdfReader(pdf_path)
        # Convert to 0-based index
        start_index = start_page - 1
        end_index = end_page - 1 
        
        full_text = ""
        print(f"Extracting '{pdf_path}' from page {start_page} to {end_page}...")
        
        # Validate pages
        if start_index < 0 or end_index >= len(reader.pages):
            print(f"Error: Page range {start_page}-{end_page} is out of bounds. Total pages: {len(reader.pages)}")
            return

        for i in range(start_index, end_index + 1):
            try:
                text = reader.pages[i].extract_text()
                full_text += f"\n--- Page {i+1} ---\n"
                full_text += text
            except Exception as e:
                print(f"Error reading page {i+1}: {e}")
                
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(full_text)
        print(f"Success! Extracted text saved to: {output_file}")
        
    except Exception as e:
        print(f"Error opening PDF: {e}")

if __name__ == "__main__":
    # Usage: python extract_pdf_pages.py <pdf_path> <start_page> <end_page> <output_file>
    # Example: python extract_pdf_pages.py "book.pdf" 10 20 "output.txt"
    
    if len(sys.argv) < 5:
        print("Usage: python extract_pdf_pages.py <pdf_path> <start_page> <end_page> <output_file>")
        # Default fallback for quick testing if run without args
        # extract_range("Maximum_achievement_brian_tracy.pdf", 187, 205, "chapter_9_extracted.txt")
    else:
        pdf_path = sys.argv[1]
        start_page = int(sys.argv[2])
        end_page = int(sys.argv[3])
        output_file = sys.argv[4]
        
        extract_range(pdf_path, start_page, end_page, output_file)
