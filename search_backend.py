#!/usr/bin/env python3
"""
search_backend.py – multimodal semantic search (patch‑aware) with rating/intents
"""

import io, json, re, os, base64
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import numpy as np, faiss, torch
from PIL import Image
from rake_nltk import Rake
import open_clip
from open_clip import tokenize
from typing import List, Dict, Any

# ─── constants ───────────────────────────────────────────────────────────
DEVICE        = "cuda" if torch.cuda.is_available() else "cpu"
MODEL_NAME    = "ViT-B-32"
PRETRAIN_TAG  = "laion2b_s34b_b79k"
PATCH_GRID    = 3
TAG_TOP_K     = 3

VISUAL_TAGS = [
    "shoe", "sneaker", "boot", "heel",
    "pant", "trouser", "chino",
    "shirt", "dress", "jacket",
    "watch", "pattern", "plain",
]
INTENT_MAP = {
    "shoe":    ("Footwear", {"Shoes"}),
    "sneaker": ("Footwear", {"Shoes"}),
    "boot":    ("Footwear", {"Shoes"}),
    "heel":    ("Footwear", {"Shoes"}),
    "pant":    ("Apparel",  {"Trousers", "Chinos"}),
    "trouser": ("Apparel",  {"Trousers", "Chinos"}),
    "chino":   ("Apparel",  {"Trousers", "Chinos"}),
    "dress":   ("Apparel",  {"Dresses"}),
    "shirt":   ("Apparel",  {"Shirts", "Tops"}),
    "watch":   ("Accessories", {"Watches"}),
}

print("Loading models and data...")

try:
    # ─── load CLIP, FAISS & metadata ──────────────────────────────────────────
    model, _, preprocess = open_clip.create_model_and_transforms(
        MODEL_NAME, pretrained=PRETRAIN_TAG, device=DEVICE
    )

    # for patch‑tag suggestion (not used for matching itself)
    _tag_embeds = tokenize(VISUAL_TAGS).to(DEVICE)
    with torch.no_grad():
        _tag_embeds = model.encode_text(_tag_embeds)
        _tag_embeds = _tag_embeds.float()  # Convert to float32 explicitly
    TAG_EMBEDS = (_tag_embeds / _tag_embeds.norm(dim=-1, keepdim=True)).cpu()

    # Load the product data
    with open(os.path.join(os.path.dirname(__file__), "products_with_reviews.jsonl"), "r") as f:
        _docs_list = [json.loads(line) for line in f]
        DOCS = {int(d["id"]): d for d in _docs_list}

    # Load the FAISS index and IDs
    INDEX = faiss.read_index(os.path.join(os.path.dirname(__file__), "products.index"))
    IDS = np.load(os.path.join(os.path.dirname(__file__), "ids.npy"))
    
    print("Models and data loaded successfully!")
except Exception as e:
    import traceback
    print(f"Error loading models and data: {e}")
    print(traceback.format_exc())
    raise

# ─── helpers ──────────────────────────────────────────────────────────────
def extract_min_rating(q: str | None) -> float | None:
    """Extract minimum rating requirement from query text."""
    if not q:
        return None
    t = q.lower()
    if "good reviews" in t or "well rated" in t:
        return 4.0
    if m := re.search(r"(\d(?:\.\d)?)\s*stars?", t):
        return float(m.group(1))
    if m2 := re.search(r"\b(\d)\+\b", t):       # "4+ stars"
        return float(m2.group(1))
    return None


def _img_embed(img: Image.Image) -> torch.Tensor:
    """L2‑normalised float32 embedding on *CPU*."""
    try:
        # Ensure image is RGB and properly sized
        img = img.convert("RGB")
        
        # Process through CLIP
        t = preprocess(img).unsqueeze(0).to(DEVICE)
        with torch.no_grad():
            v = model.encode_image(t)
            v = v.float()  # Ensure float32 type
            
        # L2 normalize
        v = v / v.norm(dim=-1, keepdim=True)
        return v.cpu()
    except Exception as e:
        print(f"Error in image embedding: {e}")
        # Return zero vector as fallback
        return torch.zeros(1, 512, dtype=torch.float32)
    
def _zoom_embed(img: Image.Image, zoom: float = 1.2) -> torch.Tensor:
    """
    Center-zoom by factor `zoom` (>1 means zoom in).
    Crop the center 1/zoom area, then resize back to original size
    before embedding.
    """
    w, h = img.size
    cw, ch = w / zoom, h / zoom
    left, top = (w - cw) / 2, (h - ch) / 2
    box = (left, top, left + cw, top + ch)
    cropped = img.crop(box)
    zoomed = cropped.resize((w, h), Image.LANCZOS)
    return _img_embed(zoomed)



def parse_semantic_query(text):
    """
    Parses a search query into semantic components including:
    - target_items: What items we're looking for (jackets, dresses, etc.)
    - target_descriptors: What properties we want (denim, floral, etc.)
    - excluded_descriptors: What properties we DON'T want (not red, etc.)
    """
    if not text:
        return {}, {}, {}
    
    try:
        # Convert to lowercase for consistency
        text_lower = text.lower()
        
        # Define semantic categories
        item_types = {
            "dress": ["dress", "gown", "frock"],
            "jacket": ["jacket", "coat", "blazer"],
            "shirt": ["shirt", "top", "tee", "t-shirt", "tshirt", "blouse"],
            "pants": ["pant", "trouser", "jeans", "leggings", "shorts"],
            "shoes": ["shoe", "sneaker", "boot", "heel", "footwear"],
            "accessories": ["watch", "bag", "purse", "handbag", "backpack", "wallet"]
        }
        
        # Define descriptor categories
        descriptor_types = {
            "colors": ["red", "blue", "green", "yellow", "black", "white", "pink", "purple", "brown", "orange", "beige"],
            "patterns": ["floral", "striped", "plaid", "checkered", "dotted", "printed"],
            "materials": ["denim", "leather", "cotton", "silk", "wool", "polyester", "linen"],
            "styles": ["casual", "formal", "elegant", "vintage", "modern", "sporty", "classic"]
        }
        
        # Extract target items
        target_items = {}
        for category, words in item_types.items():
            for word in words:
                if word in text_lower:
                    target_items[category] = word
                    break
        
        # Extract descriptors
        target_descriptors = {}
        for category, words in descriptor_types.items():
            for word in words:
                # Check for "not [word]" or "no [word]" patterns
                not_pattern = f"not {word}"
                no_pattern = f"no {word}"
                except_pattern = f"except {word}"
                but_not_pattern = f"but not {word}"
                
                if any(neg in text_lower for neg in [not_pattern, no_pattern, except_pattern, but_not_pattern]):
                    continue  # Skip this word as it's excluded
                
                if word in text_lower:
                    target_descriptors[category] = target_descriptors.get(category, []) + [word]
        
        # Extract excluded descriptors (things we DON'T want)
        excluded_descriptors = {}
        for category, words in descriptor_types.items():
            for word in words:
                # Detect negative patterns
                not_pattern = f"not {word}"
                no_pattern = f"no {word}"
                except_pattern = f"except {word}"
                but_not_pattern = f"but not {word}"
                
                if any(neg in text_lower for neg in [not_pattern, no_pattern, except_pattern, but_not_pattern]):
                    excluded_descriptors[category] = excluded_descriptors.get(category, []) + [word]
        
        return target_items, target_descriptors, excluded_descriptors
    except Exception as e:
        print(f"Error parsing query: {e}")
        return {}, {}, {}


def _best_patch(img: Image.Image, text_vec: torch.Tensor, semantic_query=None) -> Image.Image:
    """
    Enhanced patch selection that uses semantic understanding to find
    the most relevant image region based on query components.
    """
    try:
        # Default to general similarity if no specific semantic query
        if semantic_query is None or not any(semantic_query):
            return _standard_patch_selection(img, text_vec)
        
        target_items, target_descriptors, excluded = semantic_query
        
        # Prioritize finding clothing items mentioned in the query
        if target_items:
            print(f"Looking for specific items in image: {target_items}")
            # For clothing detection, we'd ideally use a specialized model
            # Since we don't have that, we'll use a denser grid approach
            FINE_GRID = 6
            
            # Calculate grid dimensions
            w, h = img.size
            pw, ph = w // FINE_GRID, h // FINE_GRID
            
            # Skip tiny patches
            if pw < 40 or ph < 40:
                return img
                
            # Try overlapping patches for better coverage
            best_sim, best_crop = -1.0, img
            
            # Create individual item embeddings for better matching
            item_text_vecs = {}
            for category, item in target_items.items():
                try:
                    # Create a focused embedding for this item type
                    tok = tokenize([item]).to(DEVICE)
                    with torch.no_grad():
                        item_vec = model.encode_text(tok)
                        item_vec = item_vec.float()
                    item_text_vecs[category] = item_vec / item_vec.norm(dim=-1, keepdim=True)
                except Exception as e:
                    print(f"Error creating embedding for {item}: {e}")
                    continue
            
            # If we have material descriptors, prioritize them in the search
            material_focus = None
            if "materials" in target_descriptors and target_descriptors["materials"]:
                material = target_descriptors["materials"][0]
                try:
                    # Create embedding for the material
                    mat_tok = tokenize([material]).to(DEVICE)
                    with torch.no_grad():
                        mat_vec = model.encode_text(mat_tok)
                        mat_vec = mat_vec.float()
                    material_focus = mat_vec / mat_vec.norm(dim=-1, keepdim=True)
                except Exception as e:
                    print(f"Error creating material embedding for {material}: {e}")
            
            # Use combined vec weighted towards materials and items
            search_vec = text_vec
            if material_focus is not None:
                # Weight material higher for material-focused searches
                search_vec = 0.7 * material_focus.cpu() + 0.3 * text_vec.cpu()
            
            # Try patches with more overlap for clothing items
            for gy in range(FINE_GRID*2-1):
                for gx in range(FINE_GRID*2-1):
                    try:
                        # Use half-steps for more granular search
                        x1 = max(0, int(gx * pw/2))
                        y1 = max(0, int(gy * ph/2))
                        x2 = min(w, x1 + pw)
                        y2 = min(h, y1 + ph)
                        
                        # Skip too small regions
                        if x2-x1 < 30 or y2-y1 < 30:
                            continue
                        
                        crop = img.crop((x1, y1, x2, y2))
                        
                        # Get embedding and compare
                        emb = _img_embed(crop)
                        
                        # Calculate similarity with the search vector
                        sim = torch.cosine_similarity(emb, search_vec)[0].item()
                        
                        # Extra boost for patches that match item-specific embeddings
                        for item_vec in item_text_vecs.values():
                            item_sim = torch.cosine_similarity(emb, item_vec.cpu())[0].item()
                            if item_sim > 0.2:  # Reasonable similarity threshold
                                sim += 0.1  # Boost score for matches
                        
                        if sim > best_sim:
                            best_sim, best_crop = sim, crop
                    except Exception as e:
                        print(f"Error processing patch at {gx},{gy}: {e}")
                        continue
            
            print(f"Best patch score: {best_sim:.4f}")
            return best_crop
        
        # Fall back to standard patch selection
        return _standard_patch_selection(img, text_vec)
    
    except Exception as e:
        print(f"Error in semantic patch selection: {e}")
        return _standard_patch_selection(img, text_vec)


def _standard_patch_selection(img: Image.Image, text_vec: torch.Tensor) -> Image.Image:
    """
    Standard patch selection using grid search when semantic info isn't available.
    """
    try:
        # Ensure inputs are properly formatted
        text_vec = text_vec.cpu().float()
        
        # Use a finer grid for more precise patch selection
        FINE_GRID = 5  # 5x5 grid instead of 3x3
        
        # Calculate grid dimensions
        w, h = img.size
        pw, ph = w // FINE_GRID, h // FINE_GRID
        
        # Handle small images
        if pw < 50 or ph < 50:
            return img
            
        best_sim, best_crop = -1.0, img
        
        # Store all similarities for debugging
        all_sims = {}
        
        print(f"Using standard patch selection with {FINE_GRID}x{FINE_GRID} grid")
        
        # Try each grid patch with overlap for better coverage
        for gy in range(FINE_GRID):
            for gx in range(FINE_GRID):
                # Extract patch with some overlap
                x1 = max(0, gx * pw - pw//4)
                y1 = max(0, gy * ph - ph//4)
                x2 = min(w, x1 + pw + pw//2)
                y2 = min(h, y1 + ph + ph//2)
                
                crop = img.crop((x1, y1, x2, y2))
                
                # Get embedding and compare
                emb = _img_embed(crop)
                sim = torch.cosine_similarity(emb, text_vec)[0].item()
                
                # Store this similarity
                patch_id = f"{gx},{gy}"
                all_sims[patch_id] = sim
                
                if sim > best_sim:
                    best_sim, best_crop = sim, crop
        
        # Log the best patch info
        print(f"Best patch similarity: {best_sim:.4f}")
        
        # Use a fallback strategy for low similarity scores
        if best_sim < 0.15:
            print("Low similarity score - using center crop fallback")
            # Center crop as fallback
            cw, ch = w//2, h//2
            crop_size = min(cw, ch)
            x1 = (w - crop_size)//2
            y1 = (h - crop_size)//2
            return img.crop((x1, y1, x1 + crop_size, y1 + crop_size))

        return best_crop
    except Exception as e:
        print(f"Error finding best patch: {e}")
        return img  # Return the full image as fallback


def _patch_tags_from_embed(embed: torch.Tensor):
    """Extract visual tags from embedding."""
    try:
        sims = (embed @ TAG_EMBEDS.T).squeeze(0)
        idx  = sims.topk(TAG_TOP_K).indices
        return {VISUAL_TAGS[i] for i in idx}
    except Exception as e:
        print(f"Error extracting patch tags: {e}")
        return set()  # Return empty set as fallback


def filter_products(raw_idxs, target_items, target_descriptors, excluded_descriptors):
    """
    Semantically filter products based on target and excluded features.
    """
    try:
        # Start with all products
        filtered_idxs = raw_idxs.copy() if raw_idxs is not None else []
        
        if not filtered_idxs:
            return []
        
        # Apply category filters if we have target items
        if target_items:
            # Get master categories and subcategories to match
            cat_targets = set()
            subcats = set()
            
            for category, item in target_items.items():
                # Map item to master category
                if category == "dress":
                    cat_targets.add("Apparel")
                    subcats.add("Dresses")
                elif category in ["jacket", "shirt"]:
                    cat_targets.add("Apparel")
                    if category == "jacket":
                        subcats.update(["Jackets", "Blazers", "Coats"])
                    else:
                        subcats.update(["Shirts", "Tops", "T-shirts"])
                elif category == "pants":
                    cat_targets.add("Apparel")
                    subcats.update(["Trousers", "Jeans", "Pants"])
                elif category == "shoes":
                    cat_targets.add("Footwear")
                    subcats.update(["Shoes", "Sneakers", "Boots"])
                elif category == "accessories":
                    cat_targets.add("Accessories")
                    
            if cat_targets and subcats:
                print(f"Filtering by categories: {cat_targets} - {subcats}")
                category_filtered = []
                for idx in filtered_idxs:
                    try:
                        product_id = int(IDS[idx])
                        if product_id not in DOCS:
                            continue
                        doc = DOCS[product_id]
                        
                        # Check if product matches any of our target categories
                        master_cat = doc.get("masterCategory")
                        sub_cat = doc.get("subCategory")
                        article_type = doc.get("articleType", "").lower()
                        
                        # Various ways to match categories
                        if (master_cat in cat_targets and 
                            (sub_cat in subcats or 
                             any(s.lower() in article_type for s in subcats))):
                            category_filtered.append(idx)
                    except Exception as e:
                        # Skip this product if there's an error
                        continue
                        
                if category_filtered:
                    print(f"Category filtered: {len(category_filtered)} of {len(filtered_idxs)} items")
                    filtered_idxs = category_filtered
        
        # Apply descriptor filters for what we want
        if target_descriptors:
            descriptor_filtered = []
            
            # Focus on most important descriptors: materials and colors
            key_descriptors = []
            if "materials" in target_descriptors:
                key_descriptors.extend(target_descriptors["materials"])
            if "patterns" in target_descriptors:
                key_descriptors.extend(target_descriptors["patterns"])
            if "colors" in target_descriptors:
                key_descriptors.extend(target_descriptors["colors"])
            
            if key_descriptors:
                print(f"Filtering for descriptors: {key_descriptors}")
                for idx in filtered_idxs:
                    try:
                        product_id = int(IDS[idx])
                        if product_id not in DOCS:
                            continue
                        doc = DOCS[product_id]
                        
                        # Check product name and properties
                        product_name = doc.get("productDisplayName", "").lower()
                        base_color = doc.get("baseColour", "").lower()
                        
                        # Match any of our target descriptors in name or color
                        if any(d in product_name for d in key_descriptors) or any(d == base_color for d in key_descriptors):
                            descriptor_filtered.append(idx)
                    except Exception as e:
                        # Skip this product if there's an error
                        continue
                        
                if descriptor_filtered:
                    print(f"Descriptor filtered: {len(descriptor_filtered)} of {len(filtered_idxs)} items")
                    filtered_idxs = descriptor_filtered
        
        # Apply exclusion filters for what we don't want
        if excluded_descriptors:
            remaining_idxs = []
            
            # Focus on excluded colors and materials
            excluded_features = []
            if "colors" in excluded_descriptors:
                excluded_features.extend(excluded_descriptors["colors"])
            if "materials" in excluded_descriptors:
                excluded_features.extend(excluded_descriptors["materials"])
            
            if excluded_features:
                print(f"Excluding features: {excluded_features}")
                for idx in filtered_idxs:
                    try:
                        product_id = int(IDS[idx])
                        if product_id not in DOCS:
                            continue
                        doc = DOCS[product_id]
                        
                        # Check product name and properties
                        product_name = doc.get("productDisplayName", "").lower()
                        base_color = doc.get("baseColour", "").lower()
                        
                        # Only include if the product DOESN'T match any excluded features
                        if not any(d in product_name for d in excluded_features) and not any(d == base_color for d in excluded_features):
                            remaining_idxs.append(idx)
                    except Exception as e:
                        # Skip this product if there's an error
                        continue
                        
                if remaining_idxs:
                    print(f"Exclusion filtered: {len(remaining_idxs)} of {len(filtered_idxs)} items")
                    filtered_idxs = remaining_idxs
        
        return filtered_idxs
    except Exception as e:
        print(f"Error in filter_products: {e}")
        return raw_idxs if raw_idxs is not None else []


def search(text: str | None = None,
           image_bytes: bytes | None = None,
           k: int = 9):
    """
    True semantic multimodal search that handles complex queries including:
    - Material/item understanding (denim jacket, floral dress)
    - Negation ("not red", "similar design but not red") 
    - Visual region focus based on semantic understanding
    """
    try:
        # Parse the query semantically
        semantic_components = None
        if text:
            target_items, target_descriptors, excluded_descriptors = parse_semantic_query(text)
            semantic_components = (target_items, target_descriptors, excluded_descriptors)
            
            # Use standard print formatting to avoid Unicode issues
            print(f"Semantic query analysis:")
            print(f"- Target items: {target_items}")
            print(f"- Target descriptors: {target_descriptors}")
            print(f"- Excluded descriptors: {excluded_descriptors}")
        
        # 1) ── text → embedding + keywords
        vecs, text_vec, text_kw = [], None, set()
        if text:
            try:
                print(f"Processing text query: {text}")
                
                # Get text embedding
                tok = tokenize([text]).to(DEVICE)
                with torch.no_grad():
                    text_vec = model.encode_text(tok)
                    text_vec = text_vec.float()  # Convert to float32
                text_vec = text_vec / text_vec.norm(dim=-1, keepdim=True)
                vecs.append(text_vec.cpu().numpy()[0])
                
                # Extract keywords using RAKE
                rk = Rake()
                rk.extract_keywords_from_text(text)
                text_kw = {p.lower() for p in rk.get_ranked_phrases()[:5]}
                
                # Add semantic components to keywords
                if semantic_components:
                    items = semantic_components[0]
                    descriptors = semantic_components[1]
                    
                    for item in items.values():
                        text_kw.add(item)
                    
                    for desc_list in descriptors.values():
                        for desc in desc_list:
                            text_kw.add(desc)
                
                print(f"Final text keywords: {text_kw}")
            except Exception as e:
                print(f"Error processing text input: {e}")

                        # 2) ── image → patch → vec & tags
        patch_b64, user_patch_vec, user_tags = None, None, set()
        if image_bytes:
            try:
                print("Processing image input")
                full_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

                # ─── simple center-zoom with integer coords ───────────────────────────
                w, h     = full_img.size
                zoom      = 1.2
                cw, ch    = int(w / zoom), int(h / zoom)
                left, top = (w - cw) // 2, (h - ch) // 2
                box       = (left, top, left + cw, top + ch)
                print(f"Zoom-crop box: {box}")   # should be something like (32,16,288,272)
                patch_img = full_img.crop(box).resize((w, h), Image.LANCZOS)

                # embed that zoomed image
                user_patch_vec = _img_embed(patch_img)
                vecs.append(user_patch_vec.cpu().numpy()[0])

                # save preview for the API response
                buf      = io.BytesIO()
                patch_img.save(buf, format="JPEG")
                patch_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

                # extract tags
                user_tags = _patch_tags_from_embed(user_patch_vec)
                print(f"Image tags: {user_tags}")

            except Exception as e:
                print(f"Error processing image input: {e}")



        # Nothing to search with
        if not vecs:
            print("No inputs for search")
            return []

        # 3) ── Combine vectors and search
        print(f"Searching with {len(vecs)} vectors")
        
        # Weight vectors (text has more weight for semantic queries)
        if len(vecs) > 1 and semantic_components and any(semantic_components):
            # For highly specific semantic queries, text should have more weight
            weights = np.array([0.65, 0.35])  # Text 65%, Image 35%
            qvec = np.average(vecs, axis=0, weights=weights)
        elif len(vecs) > 1:
            # Standard text+image query
            weights = np.array([0.55, 0.45])  # Text 55%, Image 45%
            qvec = np.average(vecs, axis=0, weights=weights)
        else:
            qvec = vecs[0]
        
        qvec = qvec.astype('float32')  # Ensure float32 for FAISS
        qvec /= np.linalg.norm(qvec)
        
        # Get raw search results - get more results for filtering
        _, I = INDEX.search(qvec[None, :], min(k*8, 500))  # Cap at 500 to avoid memory issues
        raw_idxs = [int(idx) for idx in I[0] if 0 <= idx < len(IDS)]  # Ensure valid indices
        print(f"Raw search results: {len(raw_idxs)} items")
        
        # 4) ── Apply semantic filters based on query understanding
        filtered_idxs = raw_idxs
        if semantic_components:
            target_items, target_descriptors, excluded_descriptors = semantic_components
            filtered_idxs = filter_products(raw_idxs, target_items, target_descriptors, excluded_descriptors)
            
        # 5) ── Extract product IDs and prepare results
        result_products = []
        for idx in filtered_idxs[:k]:
            try:
                product_id = int(IDS[idx])
                if product_id not in DOCS:
                    continue
                    
                # Get the product data
                product = DOCS[product_id]
                
                # Generate a meaningful explanation
                why = "Matched based on your search criteria"
                
                if semantic_components:
                    target_items, target_descriptors, excluded = semantic_components
                    
                    # Explain the match based on semantics
                    article_type = product.get('articleType', '').lower()
                    base_color = product.get('baseColour', '').lower()
                    
                    # Build explanation based on matched criteria
                    reasons = []
                    
                    # Check if we matched a target item
                    for category, item in target_items.items():
                        if item.lower() in article_type or item.lower() in product.get('productDisplayName', '').lower():
                            reasons.append(item)
                    
                    # Check if we matched descriptors
                    for category, descriptors in target_descriptors.items():
                        for desc in descriptors:
                            if desc == base_color or desc in product.get('productDisplayName', '').lower():
                                if desc not in reasons:  # Avoid duplicates
                                    reasons.append(desc)
                    
                    if reasons:
                        why = f"Matched: **{' '.join(reasons)} {article_type}**"
                    else:
                        why = f"Matched: **{base_color} {article_type}** similar to your query"
                
                # Prepare the result
                result_products.append({
                    "id": product_id,
                    "rank": len(result_products) + 1,
                    "name": product["productDisplayName"],
                    "image": product.get("image_url") or product.get("image_filename"),
                    "rating": float(product.get("rating", 0)) if product.get("rating") is not None else 0,
                    "numReviews": int(product.get("numReviews", 0)),
                    "price": float(product.get("price")) if product.get("price") is not None else None,
                    "discount": float(product.get("discountPercent")) if product.get("discountPercent") is not None else None,
                    "why": why,
                    "patch": patch_b64
                })
            except Exception as e:
                print(f"Error processing result {idx}: {e}")
                continue
        
        print(f"Final results: {len(result_products)} items")
        return result_products
        
    except Exception as e:
        import traceback
        print(f"Search function error: {e}")
        # Avoid Unicode encoding issues in traceback
        try:
            print(traceback.format_exc())
        except UnicodeEncodeError:
            print("Error: Unicode encoding issue in traceback")
        return []

