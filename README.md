<!-- README.md – Enhanced Semantic Search for E-Commerce -->
🛍️ Enhanced Semantic Search for E-Commerce
===========================================

![image](https://github.com/user-attachments/assets/74afc582-6772-4639-b11c-e07fab5af660)

**Problem:**  
Traditional search chops “red floral dress under 200 AED” into isolated keywords—often showing irrelavant results.

**Solution:**  
Our semantic engine reads the full intent (floral dress + red + garden party + ≤ 200 AED) and returns exactly those dresses, with clear “why this result” labels and instant virtual try-on.

🚀 Project Overview
-------------------

Traditional e-commerce search engines fail to understand shopper *intent*. Searching for a “pastel dress” might return nail polish. We fix that.

**This system empowers users to search using:**
- 📝 Natural language queries (“floral red dress under AED 200”)
- 🖼️ Images (upload a product photo or outfit reference)
- ✨ Or both, simultaneously

The engine fuses text + image embeddings and in-loop ratings/price filters to deliver *precise, explainable* results—backed by an immersive virtual try-on experience.

🎯 The Real Problem
-------------------

Traditional search engines treat queries as bags of keywords.

*   🔴 “Pastel clothes” → returns nail polish bottles on the Most Popualr Fashion store site in UAE

![Screenshot 2025-05-20 153410](https://github.com/user-attachments/assets/afe9e65c-9e1a-4471-8f67-f6f4062e64ec)

    
*   🕒 Shoppers spend extra minutes refining queries or leave frustrated
    
*   📉 Retailers lose sales and face higher bounce rates
    

**We solve this by**:

1.  Understanding **context**: identifying occasions, styles, and nuances.
    
2.  Fusing **text + visual intent** in a single unified embedding.
    
3.  Offering **interactive try-on** to boost confidence and reduce returns.

    
## 🔑 Key Features

### 🔍 Multimodal Semantic Search  
- Fuse text + image + reviews into unified CLIP-based embeddings  
- Instant vector-based retrieval on 45k+ items using FAISS

### 🧠 Explainable Recommendations  
- “Why we recommend this” panels powered by rule-engine + Gemini polish  
- Shows attributes, match rationale, and confidence tags

### 👗 Try Before You Buy – Virtual Try-On  
- Upload a selfie, see yourself in any dress  
- Pipeline: U²-Net → OpenPose → CP-VTON → GAN → Blending

### ⚡ FastAPI Backend + Intuitive React UI  
- 100ms latency on consumer-grade hardware  
- Chips, loaders, patch previews, tooltips, and fallback handling

## 🛠️ Tech Stack

| Layer                 | Technologies Used                                                                            |
|----------------------|----------------------------------------------------------------------------------------------|
| **Models**     | OpenCLIP (ViT-B/32), BLIP, Gemini API, FAISS, CP-VTON, U²-Net, OpenPose                      |
| **Backend (API)**     | Python 3.11, FastAPI, Pydantic, FAISS, torch, NumPy                                          |
| **Frontend (UI)**     | React 18, TypeScript, Node.js, TailwindCSS, Vite, Lucide Icons                         |
| **Storage & Assets**  | MongoDB, Local asset store for segmented masks and try-on outputs                            |
| **Dataset**     | Selenium (for scraping), Python scripts (for augmentation & indexing dataset), XGBoost (caption ranking) |


🏗️ System Architecture
-----------------------

    flowchart LR
      subgraph Preprocessing
        A[Raw Catalog & Images]
        A --> B[Data Cleaning & Normalization]
        B --> C[BLIP Captioning & Review Generation]
        C --> D[Embedding: OpenCLIP Text & Image]
        D --> E[FAISS FlatIP Index Build]
      end
    
      subgraph Query Pipeline
        Q[User Query: Text / Image]
        Q --> F[Embed Query via OpenCLIP]
        F --> G[FAISS Search (Top-k)]
        G --> H[Facet Reranking & Explainable Filter]
        H --> I[FastAPI → JSON Response]
        I --> J[React Frontend]
        J -->|"Try On"| K[Virtual Try-On Service]
        K --> J
      end

## 🎥 Live Demo 

[👀✨ Click here to explore our project! ](https://www.canva.com/design/DAGodjKFnY0/z5C1IPc4cQ99Euixpy3PdQ/watch?utm_content=DAGodjKFnY0&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h29ac98f660)


## 📊 Performance & Benchmarks (30-user evaluation)

![image](https://github.com/user-attachments/assets/8b3200e5-7600-4aff-811c-b499e28f251b)

| Metric                              | Outcome                                      |
|-------------------------------------|----------------------------------------------|
| **User preference rate**            | 60% chose our system over baseline methods   |
| **Time to first relevant result**   | ↓ 50% (1.2s vs. 2.8s in keyword search)      |
| **Trust Score (Explainability)**    | 4.6 / 5 average                              |
| **Post Try-On Add-to-Cart Rate**    | 28% (2x higher than baseline search UX)      |


🛤️ Roadmap & Future Work
-------------------------

*    Real-time personalization via user-click feedback loop
    
*    Voice-based search integration


* * *

Built with ❤️ by **Shafeeqa Fathima Jahangir**, Final-Year CS @ University of West London.


