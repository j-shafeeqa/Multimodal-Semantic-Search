#!/usr/bin/env python3
# embed_products.py – threaded image loader, live speed display, FAISS-CPU/GPU safe
import os
# allow multiple OpenMP runtimes on Windows
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import json
import pathlib
import io
import urllib.request
import numpy as np
import faiss
import torch
import time
import concurrent.futures
import math

from PIL import Image
from tqdm import tqdm
import open_clip
from open_clip import tokenize

# ─── 1) Model setup ────────────────────────────────────────────────────────────
MODEL_NAME = "ViT-B-32"
device     = "cuda" if torch.cuda.is_available() else "cpu"

model, _, preprocess = open_clip.create_model_and_transforms(
    MODEL_NAME,
    pretrained="laion2b_s34b_b79k" if MODEL_NAME == "ViT-B-32" else None,
    device=device
)
print(f"▶ embedding on {device}  •  model = {MODEL_NAME}")

# ─── 2) Load metadata & include reviews+rating in text ────────────────────────
DATA     = pathlib.Path("products_with_reviews.jsonl")
raw_docs = [json.loads(line) for line in DATA.open(encoding="utf-8")]

docs = []
for d in raw_docs:
    base     = d.get("all_text", "")
    reviews  = d.get("reviews", [])
    rating   = d.get("rating", None)
    # build a blob of reviews plus the numeric rating
    rev_blob = " ".join(reviews + ([f"{rating:.1f} stars"] if rating is not None else []))
    # combine original text + its reviews + rating string
    d["all_text_with_reviews"] = f"{base} {rev_blob}".strip()
    docs.append(d)

total       = len(docs)
batch_size  = 128
num_batches = math.ceil(total / batch_size)

# ─── 3) Fast image loader ──────────────────────────────────────────────────────
def fetch_image(path_or_url):
    try:
        p = pathlib.Path(path_or_url)
        if p.exists():
            return Image.open(p).convert("RGB")
        with urllib.request.urlopen(path_or_url, timeout=4) as r:
            return Image.open(io.BytesIO(r.read())).convert("RGB")
    except Exception:
        return Image.new("RGB", (224, 224), "gray")

# ─── 4) Embed loop with progress bar ───────────────────────────────────────────
ids, chunks = [], []
start = time.time()

for b in tqdm(range(num_batches), desc="Batches", unit="batch"):
    i0    = b * batch_size
    batch = docs[i0 : i0 + batch_size]

    # — text+reviews+rating → tokens (CPU→GPU) —
    texts       = [d["all_text_with_reviews"] for d in batch]
    text_tokens = tokenize(texts) \
        .pin_memory() \
        .to(device, non_blocking=True)

    # — images (threaded fetch + preprocess) —
    paths     = [d.get("image_filename") or d.get("image_url") for d in batch]
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        imgs = list(pool.map(fetch_image, paths))
    img_tensor = torch.stack([preprocess(im) for im in imgs]) \
        .pin_memory() \
        .to(device, non_blocking=True)

    # — encode (mixed precision) —
    with torch.no_grad(), torch.amp.autocast(device_type="cuda"):
        t_feats = model.encode_text(text_tokens)
        i_feats = model.encode_image(img_tensor)

    # — normalize + fuse embeddings —
    t_feats = t_feats / t_feats.norm(dim=-1, keepdim=True)
    i_feats = i_feats / i_feats.norm(dim=-1, keepdim=True)
    fused   = (t_feats + i_feats).cpu().numpy().astype("float32")

    chunks.append(fused)
    ids.extend([d["id"] for d in batch])

    done    = min((b+1)*batch_size, total)
    elapsed = time.time() - start
    speed   = done / elapsed if elapsed > 0 else 0
    tqdm.write(f"  processed {done}/{total}  •  {speed:.1f} vec/s")

# ─── 5) Build & save FAISS index ───────────────────────────────────────────────
vecs = np.concatenate(chunks, axis=0)
faiss.normalize_L2(vecs)

index = faiss.IndexFlatIP(vecs.shape[1])
if hasattr(faiss, "get_num_gpus") and faiss.get_num_gpus() > 0:
    index = faiss.index_cpu_to_all_gpus(index)

index.add(vecs)
index_to_save = (
    faiss.index_gpu_to_cpu(index)
    if hasattr(faiss, "index_gpu_to_cpu")
    else index
)

faiss.write_index(index_to_save, "products.index")
np.save("ids.npy", np.array(ids, dtype=np.int32))

print(f"\n✅ Finished in {time.time()-start:.1f}s • {vecs.shape[0]} vectors")

