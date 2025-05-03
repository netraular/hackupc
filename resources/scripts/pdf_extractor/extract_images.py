import fitz  # PyMuPDF
import os
import json

pdf_path = "/var/www/html/hackupc/resources/files/maual.pdf"
output_folder = "/var/www/html/hackupc/resources/files/extracted_images"
json_output_path = "extracted_data.json"

os.makedirs(output_folder, exist_ok=True)

doc = fitz.open(pdf_path)
data = []

for page_index in range(len(doc)):
    page = doc.load_page(page_index)
    page_text = page.get_text()
    images_info = []

    for img_index, img in enumerate(page.get_images(full=True)):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]
        image_filename = f"page{page_index + 1}_img{img_index + 1}.{image_ext}"
        image_path = os.path.join(output_folder, image_filename)
        
        with open(image_path, "wb") as f:
            f.write(image_bytes)
        
        images_info.append(image_filename)

    data.append({
        "page": page_index + 1,
        "text": page_text,
        "images": images_info
    })

with open(json_output_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Images and text extracted successfully to JSON.")
