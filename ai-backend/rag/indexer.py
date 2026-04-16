import os
from llama_index.core import Document, VectorStoreIndex, StorageContext, Settings
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from qdrant_client import QdrantClient

def index_text_content(text: str, source_url: str) -> str:
    # Use same embedding model as engine.py so vector spaces match
    Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
    Settings.chunk_size = 512
    Settings.chunk_overlap = 50

    # Connect to Qdrant
    url = os.getenv("QDRANT_URL", "http://localhost:6333")
    qdrant_client = QdrantClient(url=url, api_key=os.getenv("QDRANT_API_KEY") or None)
    vector_store = QdrantVectorStore(client=qdrant_client, collection_name="morchantra_docs")
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    doc = Document(text=text, metadata={"source": source_url})

    VectorStoreIndex.from_documents(
        [doc], storage_context=storage_context, show_progress=True
    )

    return "Indexing completed successfully."
