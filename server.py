import os
from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from search_backend import search, DOCS
import time
import uvicorn
import sys

# allow macOS accelerator hack
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

print(f"Python version: {sys.version}")
print(f"Current working directory: {os.getcwd()}")

# Add the Backend directory to the path if needed
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)
    print(f"Added {backend_dir} to sys.path")

# 1️⃣ Create the app
app = FastAPI()

# 2️⃣ Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Category mapping for special cases
CATEGORY_MAPPING = {
    "sneakers": {
        "masterCategory": "Footwear",
        "subCategories": ["Sports Shoes", "Casual Shoes", "Sneakers"],
    },
    "tshirts": {
        "masterCategory": "Apparel",
        "subCategories": ["Tshirts", "T-Shirts", "Tops"],
    },
    "bags": {
        "masterCategory": "Accessories",
        "subCategories": ["Bags", "Handbags", "Backpacks"],
    },
    "pants": {
        "masterCategory": "Apparel",
        "subCategories": ["Pants", "Trousers", "Jeans"],
    },
    "dresses": {
        "masterCategory": "Apparel",
        "subCategories": ["Dresses"],
    },
    "shirts": {
        "masterCategory": "Apparel",
        "subCategories": ["Shirts"],
    },
    "jackets": {
        "masterCategory": "Apparel",
        "subCategories": ["Jackets"],
    },
}

# Helper function to normalize category names
def normalize_category(category: str) -> str:
    return category.strip().lower().replace(" ", "").replace("-", "").replace("_", "")

# 3️⃣ Register your routes

@app.get("/")
async def root():
    return {"message": "Fashion Search API"}

@app.get("/api/categories")
def list_categories():
    """List all available article types in the dataset."""
    categories = set()
    for p in DOCS.values():
        if article_type := p.get("articleType"):
            categories.add(article_type)
    return sorted(list(categories))

@app.post("/api/search")
async def api_search(
    text: str = Form(""),
    file: UploadFile | None = File(None),
    limit: int = Form(100),
):
    """
    Handles multimodal search using text + optional image.
    """
    start_time = time.time()
    print(f"Received search request - Text: '{text}', Image: {file is not None}")
    
    try:
        # Read image bytes if an image was uploaded
        img_bytes = await file.read() if file else None
        
        # Call the search function
        results = search(text=text, image_bytes=img_bytes, k=limit)
        
        process_time = time.time() - start_time
        print(f"Search completed in {process_time:.2f}s with {len(results)} results")
        
        return results
    except Exception as e:
        try:
            error_msg = f"Search error: {str(e)}"
            print(error_msg)
            import traceback
            try:
                print(traceback.format_exc())
            except UnicodeEncodeError:
                print("Unicode error in traceback")
        except:
            print("Error handling error")
        return []

@app.get("/api/products_by_category")
def products_by_category(
    category: str = Query(..., description="Article type, e.g. T-shirts, Dresses, Pants")
):
    """
    Browse by exact articleType, falling back to semantic search if none found.
    """
    # Normalize category for comparison
    norm_category = normalize_category(category)
    
    # Check if this is a special category that needs mapping
    matches = []
    
    # First try special category mapping
    if norm_category in CATEGORY_MAPPING:
        category_info = CATEGORY_MAPPING[norm_category]
        for p in DOCS.values():
            if (p.get("masterCategory") == category_info["masterCategory"] and
                any(normalize_category(sub) in normalize_category(p.get("articleType", ""))
                    for sub in category_info["subCategories"])):
                matches.append({
                    "id": p["id"],
                    "name": p["productDisplayName"],
                    "image": p.get("image_url") or p.get("image_filename"),
                    "rating": p.get("rating", 0),
                    "numReviews": p.get("numReviews", 0),
                    "price": p.get("price"),
                    "discount": p.get("discountPercent"),
                    "why": "",
                    "patch": None,
                })
    
    # If no matches found through special mapping, try direct matching
    if not matches:
        for p in DOCS.values():
            article_type = p.get("articleType", "")
            if normalize_category(article_type) == norm_category:
                matches.append({
                    "id": p["id"],
                    "name": p["productDisplayName"],
                    "image": p.get("image_url") or p.get("image_filename"),
                    "rating": p.get("rating", 0),
                    "numReviews": p.get("numReviews", 0),
                    "price": p.get("price"),
                    "discount": p.get("discountPercent"),
                    "why": "",
                    "patch": None,
                })

    return matches

@app.get("/api/categories/{category}")
async def get_category_products(category: str):
    """
    Return products by category using special category mapping
    """
    try:
        # Normalize the category
        category = category.lower().strip()
        
        print(f"Category request: {category}")
        
        # Check for direct category match
        if category in CATEGORY_MAPPING:
            # Get the master category and subcategories
            master_category = CATEGORY_MAPPING[category]["masterCategory"]
            subcategories = CATEGORY_MAPPING[category]["subCategories"]
            
            # Build a simple query for that category
            query = f"{category}"
            results = search(text=query, k=50)
            
            # Extra filtering for exact category match
            filtered_results = []
            for product in results:
                product_id = product.get("id")
                doc = DOCS.get(product_id)
                if not doc:
                    continue
                    
                doc_master = doc.get("masterCategory")
                doc_sub = doc.get("subCategory")
                doc_article = doc.get("articleType")
                
                # Check if this product matches our category criteria
                if (doc_master == master_category and 
                    (doc_sub in subcategories or doc_article in subcategories)):
                    filtered_results.append(product)
            
            print(f"Found {len(filtered_results)} products for category {category}")
            return filtered_results[:50]  # Limit to 50 products
            
        # If no special mapping, just do a search
        results = search(text=category, k=50)
        return results
    except Exception as e:
        import traceback
        print(f"Category search error: {str(e)}")
        print(traceback.format_exc())
        return []

if __name__ == "__main__":
    try:
        print("Starting server...")
        port = int(os.environ.get("PORT", 8000))
        uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)
    except Exception as e:
        print(f"Server error: {e}")
        import traceback
        print(traceback.format_exc())




