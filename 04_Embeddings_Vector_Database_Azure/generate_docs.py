import os

# Output directory configuration
folder_name = "rag_corpus"
if not os.path.exists(folder_name):
    os.makedirs(folder_name)

# Dictionary with 10 technical topics and extended descriptions
technical_topics = {
    "rag_architecture": "Retrieval-Augmented Generation (RAG) optimizes LLMs by retrieving data from external sources.",
    "vector_embeddings": "Embeddings transform words into numerical vectors within a multidimensional latent space.",
    "azure_ai_search": "Azure AI Search is a search engine supporting vector indexing and enterprise-grade semantic ranking.",
    "hnsw_algorithm": "The Hierarchical Navigable Small World algorithm allows for nearest neighbor searches with ultra-low latency.",
    "data_cleaning": "The quality of an AI system depends directly on the preprocessing and cleaning of input data.",
    "transformer_models": "The Transformer architecture uses attention mechanisms to process data sequences in parallel.",
    "index_management": "A well-configured cloud index must balance storage cost and retrieval speed.",
    "cloud_security": "Using Managed Identities in Azure eliminates the need to store access keys in the source code.",
    "batch_processing": "Batch processing allows for handling massive data volumes at scheduled intervals.",
    "data_visualization": "Tools like Power BI allow transforming complex data into actionable business insights."
}

# Generate 10 files with repeated content to simulate "heavier" documents
for i, (title, content) in enumerate(technical_topics.items(), 1):
    file_path = os.path.join(folder_name, f"{i:02d}_{title}.txt")
    with open(file_path, "w", encoding="utf-8") as f:
        # We repeat the content to ensure the indexer has enough text for chunking
        f.write(f"TECHNICAL DOCUMENTATION REGARDING {title.upper()}\n\n")
        f.write((content + " ") * 100) 
    print(f"File generated: {file_path}")

print(f"\nDone. Now upload the files from the '{folder_name}' folder to your Azure Blob Storage.")