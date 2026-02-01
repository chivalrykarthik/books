"""
Enhanced PDF Extractor
======================
Extracts text, images, tables, and code blocks from PDF pages.
Images are saved separately and referenced in the output text file.

Requirements:
    pip install pypdf pymupdf pdfplumber pillow

Usage:
    python extract_pdf_pages.py <pdf_path> <start_page> <end_page> <output_folder>
    
Example:
    python extract_pdf_pages.py "book.pdf" 10 20 "./chapter_10"
"""

import sys
import os
import re
import fitz  # PyMuPDF
import pdfplumber
from PIL import Image
from io import BytesIO


def create_output_folder(output_folder):
    """Create output folder and images subfolder."""
    images_folder = os.path.join(output_folder, "images")
    os.makedirs(images_folder, exist_ok=True)
    return images_folder


def find_diagram_regions(page, min_area=5000, min_drawings=10):
    """
    Find distinct diagram regions on a page by clustering vector graphics.
    Returns a list of bounding boxes (fitz.Rect) for diagram regions.
    """
    try:
        drawings = page.get_drawings()
        
        if not drawings or len(drawings) < min_drawings:
            return []
        
        # Collect all drawing bounding boxes
        all_rects = []
        for drawing in drawings:
            rect = drawing.get("rect")
            if rect:
                all_rects.append(fitz.Rect(rect))
        
        if not all_rects:
            return []
        
        # Cluster nearby drawings into regions
        # Use a simple approach: merge overlapping or nearby rectangles
        regions = []
        used = set()
        
        page_width = page.rect.width
        page_height = page.rect.height
        
        # Expand threshold for grouping (10% of page dimensions)
        expand_x = page_width * 0.05
        expand_y = page_height * 0.03
        
        for i, rect1 in enumerate(all_rects):
            if i in used:
                continue
            
            # Start a new region with this rect
            region = fitz.Rect(rect1)
            used.add(i)
            
            # Keep expanding until no more rects can be added
            changed = True
            while changed:
                changed = False
                for j, rect2 in enumerate(all_rects):
                    if j in used:
                        continue
                    
                    # Expand region slightly to check for nearby rects
                    expanded = fitz.Rect(
                        region.x0 - expand_x,
                        region.y0 - expand_y,
                        region.x1 + expand_x,
                        region.y1 + expand_y
                    )
                    
                    if expanded.intersects(rect2):
                        region = region | rect2  # Union of rects
                        used.add(j)
                        changed = True
            
            regions.append(region)
        
        # Filter regions by size and aspect ratio
        valid_regions = []
        for region in regions:
            area = region.width * region.height
            
            # Skip very small regions (probably just decorations)
            if area < min_area:
                continue
            
            # Skip regions that span almost the entire page width/height
            # (these are likely page borders or full-page decorations)
            if region.width > page_width * 0.95 and region.height > page_height * 0.9:
                continue
            
            # Skip very thin regions (likely just lines or borders)
            if region.width < 50 or region.height < 50:
                continue
            
            # Skip regions that are mostly at the page edges (headers/footers)
            margin = 30
            if region.y1 < margin or region.y0 > page_height - margin:
                continue
            
            valid_regions.append(region)
        
        return valid_regions
        
    except Exception as e:
        print(f"  ⚠️ Error finding diagram regions: {e}")
        return []


def crop_diagram_region(page, region, page_num, diagram_index, images_folder, base_name, zoom=2.0, padding=10):
    """
    Crop and save a specific diagram region from a page.
    """
    try:
        # Add padding around the region
        padded_region = fitz.Rect(
            max(0, region.x0 - padding),
            max(0, region.y0 - padding),
            min(page.rect.width, region.x1 + padding),
            min(page.rect.height, region.y1 + padding)
        )
        
        # Create transformation matrix with zoom
        mat = fitz.Matrix(zoom, zoom)
        
        # Render only the cropped region
        pix = page.get_pixmap(matrix=mat, clip=padded_region)
        
        # Create filename
        image_filename = f"{base_name}_page{page_num + 1}_fig{diagram_index}.png"
        image_path = os.path.join(images_folder, image_filename)
        
        # Save the cropped image
        pix.save(image_path)
        
        print(f"  🎨 Extracted figure: {image_filename} ({pix.width}x{pix.height})")
        
        return {
            "filename": image_filename,
            "path": image_path,
            "width": pix.width,
            "height": pix.height,
            "type": "diagram",
            "index": diagram_index
        }
        
    except Exception as e:
        print(f"  ⚠️ Error cropping diagram region: {e}")
        return None


def extract_images_from_page(doc, page_num, images_folder, base_name):
    """
    Extract all images from a specific page.
    Detects diagram regions and crops them individually.
    Also extracts embedded raster images.
    Returns a list of image references with their positions.
    """
    image_refs = []
    page = doc[page_num]
    
    # First, find and extract diagram regions (vector graphics)
    diagram_regions = find_diagram_regions(page)
    
    for idx, region in enumerate(diagram_regions, start=1):
        diagram_ref = crop_diagram_region(
            page, region, page_num, idx, images_folder, base_name
        )
        if diagram_ref:
            image_refs.append(diagram_ref)
    
    # Then, extract embedded raster images
    image_list = page.get_images(full=True)
    
    for img_index, img_info in enumerate(image_list):
        xref = img_info[0]
        
        try:
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            
            # Create image filename
            image_filename = f"{base_name}_page{page_num + 1}_img{img_index + 1}.{image_ext}"
            image_path = os.path.join(images_folder, image_filename)
            
            # Save the image
            with open(image_path, "wb") as img_file:
                img_file.write(image_bytes)
            
            # Get image dimensions for reference
            img = Image.open(BytesIO(image_bytes))
            width, height = img.size
            
            image_refs.append({
                "filename": image_filename,
                "path": image_path,
                "width": width,
                "height": height,
                "type": "embedded",
                "index": img_index + 1
            })
            
            print(f"  📷 Extracted: {image_filename} ({width}x{height})")
            
        except Exception as e:
            print(f"  ⚠️ Error extracting image {img_index + 1}: {e}")
    
    return image_refs


def extract_tables_from_page(pdf_plumber_page, page_num):
    """
    Extract tables from a page and format them as markdown.
    Returns formatted table strings.
    """
    tables_text = []
    
    try:
        tables = pdf_plumber_page.extract_tables()
        
        for table_index, table in enumerate(tables):
            if not table or len(table) == 0:
                continue
                
            # Convert table to markdown format
            markdown_table = format_table_as_markdown(table, table_index + 1)
            tables_text.append(markdown_table)
            print(f"  📊 Extracted: Table {table_index + 1} ({len(table)} rows)")
            
    except Exception as e:
        print(f"  ⚠️ Error extracting tables from page {page_num + 1}: {e}")
    
    return tables_text


def format_table_as_markdown(table, table_num):
    """Convert a table to markdown format."""
    if not table or len(table) == 0:
        return ""
    
    lines = [f"\n[TABLE {table_num}]"]
    
    # Clean and process rows
    cleaned_rows = []
    for row in table:
        cleaned_row = []
        for cell in row:
            if cell is None:
                cleaned_row.append("")
            else:
                # Clean the cell content
                cell_text = str(cell).replace("\n", " ").strip()
                cleaned_row.append(cell_text)
        cleaned_rows.append(cleaned_row)
    
    if len(cleaned_rows) == 0:
        return ""
    
    # Determine column widths
    num_cols = max(len(row) for row in cleaned_rows)
    col_widths = [0] * num_cols
    
    for row in cleaned_rows:
        for i, cell in enumerate(row):
            if i < num_cols:
                col_widths[i] = max(col_widths[i], len(cell))
    
    # Create markdown table
    for row_index, row in enumerate(cleaned_rows):
        # Pad row if needed
        while len(row) < num_cols:
            row.append("")
        
        row_str = "| " + " | ".join(
            cell.ljust(col_widths[i]) for i, cell in enumerate(row)
        ) + " |"
        lines.append(row_str)
        
        # Add header separator after first row
        if row_index == 0:
            separator = "| " + " | ".join("-" * w for w in col_widths) + " |"
            lines.append(separator)
    
    lines.append("[/TABLE]\n")
    return "\n".join(lines)


def detect_code_blocks(text):
    """
    Detect and format potential code blocks in the text.
    Looks for patterns that indicate code (indentation, keywords, etc.)
    """
    lines = text.split('\n')
    result_lines = []
    in_code_block = False
    code_block_lines = []
    
    # Common programming indicators
    code_indicators = [
        r'^\s{4,}',  # 4+ spaces indentation
        r'^\s*def\s+\w+',  # Python function
        r'^\s*class\s+\w+',  # Python class
        r'^\s*import\s+\w+',  # Import statement
        r'^\s*from\s+\w+\s+import',  # From import
        r'^\s*if\s+.*:$',  # If statement
        r'^\s*for\s+.*:$',  # For loop
        r'^\s*while\s+.*:$',  # While loop
        r'^\s*return\s+',  # Return statement
        r'^\s*#.*',  # Python comment
        r'^\s*//.*',  # C-style comment
        r'^\s*public\s+',  # Java/C# public
        r'^\s*private\s+',  # Java/C# private
        r'^\s*function\s+\w+',  # JavaScript function
        r'^\s*const\s+\w+',  # Const declaration
        r'^\s*let\s+\w+',  # Let declaration
        r'^\s*var\s+\w+',  # Var declaration
        r'.*\{\s*$',  # Opening brace
        r'^\s*\}',  # Closing brace
        r'^\s*\w+\s*=\s*.+;$',  # Assignment with semicolon
        r'^\s*print\s*\(',  # Print function
        r'^\s*console\.',  # Console log
        r'^\s*System\.',  # Java System
    ]
    
    def is_code_line(line):
        """Check if a line looks like code."""
        if not line.strip():
            return None  # Empty line, could be either
        
        for pattern in code_indicators:
            if re.match(pattern, line):
                return True
        return False
    
    consecutive_code_lines = 0
    
    for i, line in enumerate(lines):
        is_code = is_code_line(line)
        
        if is_code:
            consecutive_code_lines += 1
            code_block_lines.append(line)
            
            if not in_code_block and consecutive_code_lines >= 2:
                # Start of code block detected
                in_code_block = True
                # Insert marker before the code lines we've collected
                if len(result_lines) >= consecutive_code_lines - 1:
                    result_lines = result_lines[:-(consecutive_code_lines - 1)]
                result_lines.append("\n[CODE]")
                result_lines.extend(code_block_lines)
                
        elif is_code is None:  # Empty line
            if in_code_block:
                code_block_lines.append(line)
                result_lines.append(line)
            else:
                result_lines.append(line)
                
        else:  # Not code
            if in_code_block:
                result_lines.append("[/CODE]\n")
                in_code_block = False
                
            consecutive_code_lines = 0
            code_block_lines = []
            result_lines.append(line)
    
    # Close any open code block
    if in_code_block:
        result_lines.append("[/CODE]\n")
    
    return '\n'.join(result_lines)


def extract_page_content(doc, plumber_pdf, page_num, images_folder, base_name):
    """
    Extract all content from a single page.
    Returns formatted text with image references, tables, and code blocks.
    """
    content_parts = []
    
    # Extract images
    image_refs = extract_images_from_page(doc, page_num, images_folder, base_name)
    
    # Add image references at the start of the page
    if image_refs:
        content_parts.append("\n--- IMAGES/DIAGRAMS ON THIS PAGE ---")
        for img_ref in image_refs:
            img_type = img_ref.get('type', 'embedded')
            if img_type == 'diagram':
                content_parts.append(
                    f"[DIAGRAM: {img_ref['filename']}] "
                    f"(Rendered page with vector graphics - Size: {img_ref['width']}x{img_ref['height']})"
                )
            else:
                content_parts.append(
                    f"[IMAGE: {img_ref['filename']}] "
                    f"(Embedded image - Size: {img_ref['width']}x{img_ref['height']})"
                )
        content_parts.append("--- END IMAGES/DIAGRAMS ---\n")
    
    # Extract tables
    plumber_page = plumber_pdf.pages[page_num]
    tables = extract_tables_from_page(plumber_page, page_num)
    
    # Extract text
    fitz_page = doc[page_num]
    text = fitz_page.get_text("text")
    
    # Try to detect and mark code blocks
    text_with_code = detect_code_blocks(text)
    
    content_parts.append(text_with_code)
    
    # Add tables at the end (they're usually extracted separately)
    if tables:
        content_parts.append("\n--- TABLES EXTRACTED FROM THIS PAGE ---")
        content_parts.extend(tables)
        content_parts.append("--- END TABLES ---\n")
    
    return '\n'.join(content_parts)


def extract_range(pdf_path, start_page, end_page, output_folder):
    """
    Main extraction function.
    Extracts text, images, tables, and code from a PDF within a given page range.
    """
    try:
        # Create output folders
        images_folder = create_output_folder(output_folder)
        
        # Get base name from PDF
        base_name = os.path.splitext(os.path.basename(pdf_path))[0]
        
        # Open PDF with both libraries
        doc = fitz.open(pdf_path)
        plumber_pdf = pdfplumber.open(pdf_path)
        
        # Convert to 0-based index
        start_index = start_page - 1
        end_index = end_page - 1
        
        # Validate pages
        total_pages = len(doc)
        if start_index < 0 or end_index >= total_pages:
            print(f"❌ Error: Page range {start_page}-{end_page} is out of bounds. Total pages: {total_pages}")
            return
        
        print(f"\n📚 Extracting '{pdf_path}' from page {start_page} to {end_page}...")
        print(f"📁 Output folder: {output_folder}")
        print(f"🖼️  Images folder: {images_folder}\n")
        
        full_content = []
        full_content.append(f"# PDF Extraction: {base_name}")
        full_content.append(f"# Pages: {start_page} to {end_page}")
        full_content.append(f"# Total extracted pages: {end_page - start_page + 1}")
        full_content.append("=" * 60 + "\n")
        
        total_images = 0
        total_tables = 0
        
        for page_num in range(start_index, end_index + 1):
            print(f"📄 Processing page {page_num + 1}...")
            
            full_content.append(f"\n{'='*60}")
            full_content.append(f"--- PAGE {page_num + 1} ---")
            full_content.append(f"{'='*60}\n")
            
            try:
                page_content = extract_page_content(
                    doc, plumber_pdf, page_num, images_folder, base_name
                )
                full_content.append(page_content)
                
                # Count extracted items
                total_images += len(doc[page_num].get_images())
                total_tables += len(plumber_pdf.pages[page_num].extract_tables() or [])
                
            except Exception as e:
                error_msg = f"Error extracting page {page_num + 1}: {e}"
                print(f"  ⚠️ {error_msg}")
                full_content.append(f"\n[ERROR: {error_msg}]\n")
        
        # Write output file
        output_file = os.path.join(output_folder, f"{base_name}_extracted.txt")
        with open(output_file, "w", encoding="utf-8") as f:
            f.write('\n'.join(full_content))
        
        # Print summary
        print(f"\n{'='*60}")
        print("✅ EXTRACTION COMPLETE!")
        print(f"{'='*60}")
        print(f"📄 Text file: {output_file}")
        print(f"🖼️  Total images extracted: {total_images}")
        print(f"📊 Total tables extracted: {total_tables}")
        print(f"📁 Images saved to: {images_folder}")
        
        # Close documents
        doc.close()
        plumber_pdf.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


def print_usage():
    """Print usage instructions."""
    print("""
╔══════════════════════════════════════════════════════════════╗
║           Enhanced PDF Extractor - Usage Guide               ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Usage:                                                      ║
║    python extract_pdf_pages.py <pdf> <start> <end> <folder>  ║
║                                                              ║
║  Arguments:                                                  ║
║    pdf    - Path to the PDF file                             ║
║    start  - Starting page number (1-based)                   ║
║    end    - Ending page number (1-based)                     ║
║    folder - Output folder path                               ║
║                                                              ║
║  Example:                                                    ║
║    python extract_pdf_pages.py "book.pdf" 10 20 "./ch10"     ║
║                                                              ║
║  Output:                                                     ║
║    <folder>/                                                 ║
║    ├── <pdf_name>_extracted.txt  (text with references)      ║
║    └── images/                                               ║
║        ├── <pdf_name>_page10_img1.png                        ║
║        ├── <pdf_name>_page10_img2.jpg                        ║
║        └── ...                                               ║
║                                                              ║
║  Features:                                                   ║
║    ✓ Text extraction with page markers                       ║
║    ✓ Image extraction with references in text                ║
║    ✓ Table extraction in markdown format                     ║
║    ✓ Code block detection and marking                        ║
║                                                              ║
║  Requirements:                                               ║
║    pip install pypdf pymupdf pdfplumber pillow               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
""")


if __name__ == "__main__":
    if len(sys.argv) < 5:
        print_usage()
    else:
        pdf_path = sys.argv[1]
        start_page = int(sys.argv[2])
        end_page = int(sys.argv[3])
        output_folder = sys.argv[4]
        
        extract_range(pdf_path, start_page, end_page, output_folder)
