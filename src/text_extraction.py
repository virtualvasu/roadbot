import os
import PyPDF2
from typing import Union

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF file."""
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"File Not Found: {pdf_path}")
    
    extracted_text = []

    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)

        for page_number, page in enumerate(reader.pages, start=1):
            text = page.extract_text()
            if text:
                extracted_text.append(text)
            else:
                print(f"Warning: Page {page_number} has no extractable text")
            
    return "\n".join(text.replace('\n', ' ') for text in extracted_text)

def extract_text_from_txt(txt_path: str) -> str:
    """Extract text from TXT file."""
    if not os.path.exists(txt_path):
        raise FileNotFoundError(f"File Not Found: {txt_path}")
    
    try:
        with open(txt_path, 'r', encoding='utf-8') as file:
            return file.read()
    except UnicodeDecodeError:
        # Try different encodings
        encodings = ['latin-1', 'cp1252', 'iso-8859-1']
        for encoding in encodings:
            try:
                with open(txt_path, 'r', encoding=encoding) as file:
                    return file.read()
            except UnicodeDecodeError:
                continue
        raise ValueError(f"Could not decode text file: {txt_path}")

def extract_text_from_docx(docx_path: str) -> str:
    """Extract text from DOCX file."""
    if not os.path.exists(docx_path):
        raise FileNotFoundError(f"File Not Found: {docx_path}")
    
    try:
        from docx import Document
        doc = Document(docx_path)
        text = []
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text.append(paragraph.text)
        return "\n".join(text)
    except ImportError:
        raise ImportError("DOCX support requires python-docx package. Install it with: pip install python-docx")
    except Exception as e:
        raise ValueError(f"Error extracting text from DOCX: {str(e)}")

def extract_text_from_file(file_path: str) -> str:
    """Extract text from various file types based on extension."""
    _, extension = os.path.splitext(file_path)
    extension = extension.lower()
    
    if extension == '.pdf':
        return extract_text_from_pdf(file_path)
    elif extension == '.txt':
        return extract_text_from_txt(file_path)
    elif extension == '.docx':
        return extract_text_from_docx(file_path)
    else:
        raise ValueError(f"Unsupported file type: {extension}")



if __name__ == "__main__":
    pdf_file_path = os.path.join("..","data","TN traffic rules.pdf")

    try:
        text = extract_text_from_pdf(pdf_file_path)
        output_dir = os.path.join("..","data", "processed")
        os.makedirs(output_dir, exist_ok=True)

        output_file_path = os.path.join(output_dir, "TN_traffic_rules.txt")
        
        with open(output_file_path, 'w', encoding='utf-8') as file:
            file.write(text)
        
        print(f"Extraction complete. Text saved to {output_file_path}")
    except Exception as e:
        print(f"Error: {e}")
    