import os
from llama_index.core import VectorStoreIndex, StorageContext, Settings
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.core.agent import ReActAgent
from llama_index.core.tools import QueryEngineTool, ToolMetadata
from llama_index.llms.groq import Groq
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from qdrant_client import QdrantClient
from tools.client_tools import ai_tools

# ── Global LlamaIndex settings ────────────────────────────────────────────────
# Groq: ultra-fast, free-tier LLM
Settings.llm = Groq(
    model="llama-3.1-8b-instant",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.2,
)
# HuggingFace local embedding — no API key required
Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
Settings.chunk_size = 512
Settings.chunk_overlap = 50


def build_agent(user_id: str) -> ReActAgent:
    tools = list(ai_tools)  # start with functional tools

    # Try to attach RAG tool (Qdrant may be empty on first run — that's OK)
    try:
        qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
        qdrant_client = QdrantClient(url=qdrant_url, api_key=os.getenv("QDRANT_API_KEY") or None)
        vector_store = QdrantVectorStore(client=qdrant_client, collection_name="morchantra_docs")
        index = VectorStoreIndex.from_vector_store(vector_store=vector_store)
        query_engine = index.as_query_engine(similarity_top_k=3)
        rag_tool = QueryEngineTool(
            query_engine=query_engine,
            metadata=ToolMetadata(
                name="knowledge_base_search",
                description="Search Morchantra's official documentation and website for general business answers.",
            ),
        )
        tools.append(rag_tool)
    except Exception as e:
        print(f"⚠️  RAG tool skipped (Qdrant not ready or empty): {e}")

    system_prompt = (
        "You are 'Later', the primary AI assistant for Morchantra. "
        "Answer client queries using the available tools or your knowledge base. "
        "If you already know the answer, output it immediately as your Final Answer — do not loop. "
        "If you cannot find information, say: "
        "'I couldn't find that in Morchantra's knowledge base. Would you like me to connect you to support?' "
        f"The current user ID is: {user_id}. Inject this automatically into tool calls when needed."
    )

    agent = ReActAgent.from_tools(
        tools,
        llm=Settings.llm,
        verbose=True,
        system_prompt=system_prompt,
        max_iterations=15,
    )
    return agent
