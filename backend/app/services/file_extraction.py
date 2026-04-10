from pathlib import Path
import fitz  # PyMuPDF
from pptx import Presentation


def extract_text(file_path: str) -> str:
    """Extract text from a file based on its extension."""
    path = Path(file_path)
    ext = path.suffix.lower()

    extractors = {
        ".pdf": _extract_pdf,
        ".pptx": _extract_pptx,
        ".txt": _extract_plain,
        ".md": _extract_plain,
    }

    extractor = extractors.get(ext)
    if extractor is None:
        return _extract_plain(file_path)

    return extractor(file_path)


def extract_pdf_page_images(file_path: str, output_dir: str, dpi: int = 72, max_pages: int = 30) -> list[str]:
    """Rasterize PDF pages that contain figures/images as PNGs.
    
    Returns list of saved image file paths.
    Only rasterizes pages that have embedded images (graphs, figures, diagrams).
    """
    try:
        doc = fitz.open(file_path)
    except Exception:
        return []
    
    img_dir = Path(output_dir) / "page_images"
    img_dir.mkdir(parents=True, exist_ok=True)
    
    image_paths = []
    for i, page in enumerate(doc):
        if len(image_paths) >= max_pages:
            break
        # Check if this page has embedded images (figures, graphs, diagrams)
        if page.get_images():
            try:
                pix = page.get_pixmap(dpi=dpi)
                stem = Path(file_path).stem.replace(" ", "_")[:50]
                img_path = str(img_dir / f"{stem}_p{i + 1}.png")
                pix.save(img_path)
                image_paths.append(img_path)
            except Exception:
                continue
    
    doc.close()
    return image_paths


def _extract_pdf(file_path: str) -> str:
    """Extract text from PDF using PyMuPDF."""
    doc = fitz.open(file_path)
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text()
        has_images = bool(page.get_images())
        if text.strip():
            header = f"--- PAGE {i + 1}"
            if has_images:
                header += " [CONTAINS FIGURES/IMAGES]"
            header += " ---"
            pages.append(f"{header}\n{text.strip()}")
    doc.close()
    return "\n\n".join(pages)


def _extract_pptx(file_path: str) -> str:
    """Extract text from PowerPoint slides."""
    prs = Presentation(file_path)
    slides = []
    for i, slide in enumerate(prs.slides):
        texts = []
        for shape in slide.shapes:
            if shape.has_text_frame:
                for para in shape.text_frame.paragraphs:
                    line = para.text.strip()
                    if line:
                        texts.append(line)
        if texts:
            slides.append(f"--- SLIDE {i + 1} ---\n" + "\n".join(texts))
    return "\n\n".join(slides)


def _extract_plain(file_path: str) -> str:
    """Read plain text file."""
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()
