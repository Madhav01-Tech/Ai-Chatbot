import fs from "fs";
import path from "path";
import pdf from "pdf-parse";
import { pipeline } from "@huggingface/transformers";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChromaClient } from "chromadb";

// ================= CONFIG =================
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 100;
const TOP_K_RESULTS = 2;
const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";

// ================= EMBEDDING =================
let embedder = null;

const getEmbedder = async () => {
  if (!embedder) {
    console.log("[RAG] Loading embedding model...");
    embedder = await pipeline("feature-extraction", EMBEDDING_MODEL);
    console.log("[RAG] Embedding model ready.");
  }
  return embedder;
};

export const embedText = async (text) => {
  const embed = await getEmbedder();
  const output = await embed(text, {
    pooling: "mean",
    normalize: true,
  });
  return Array.from(output.data);
};

// ================= CHROMA =================
let chromaClient = null;

const getChromaClient = () => {
  if (!chromaClient) {
    chromaClient = new ChromaClient({
      ssl: true,
      host: "api.trychroma.com",
      port: 443,
      tenant: process.env.CHROMA_TENANT,
      database: process.env.CHROMA_DATABASE,
      headers: {
        "x-chroma-token": process.env.CHROMA_API_KEY,
      },
    });
  }
  return chromaClient;
};

// ================= PDF LOADER =================
export const loadPdf = async (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`PDF not found: ${filePath}`);
  }

  console.log(`[RAG] Loading: ${path.basename(filePath)}`);

  // 1️⃣ Try PDFLoader
  try {
    const loader = new PDFLoader(filePath);
    const rawDocs = await loader.load();

    const validDocs = rawDocs.filter(
      (doc) => doc.pageContent && doc.pageContent.trim().length > 0
    );

    if (validDocs.length > 0) {
      console.log(`✅ PDFLoader worked (${validDocs.length} pages)`);
      return validDocs;
    }
  } catch (err) {
    console.warn("⚠️ PDFLoader failed:", err.message);
  }

  // 2️⃣ Fallback → pdf-parse
  try {
    const buffer = fs.readFileSync(filePath);
    const data = await pdf(buffer);

    if (data.text && data.text.trim().length > 0) {
      console.log("✅ pdf-parse fallback worked");
      return [{ pageContent: data.text }];
    }
  } catch (err) {
    console.warn("⚠️ pdf-parse failed:", err.message);
  }

  throw new Error("❌ PDF is empty or could not be parsed.");
};

// ================= CHUNKING =================
export const chunkDocuments = async (rawDocs) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });

  const chunks = await splitter.splitDocuments(rawDocs);
  console.log(`[RAG] Created ${chunks.length} chunks`);

  return chunks;
};

// ================= STORE =================
export const storeInChroma = async (chunks, collectionName) => {
  const client = getChromaClient();

  const collection = await client.getOrCreateCollection({
    name: collectionName,
    metadata: { "hnsw:space": "cosine" },
    embeddingFunction: null,
  });

  console.log("[RAG] Generating embeddings...");

  // 🚀 FAST PARALLEL EMBEDDING
  const embeddings = await Promise.all(
    chunks.map((chunk) => embedText(chunk.pageContent))
  );

  const ids = chunks.map((_, i) => `chunk-${i}`);
  const documents = chunks.map((c) => c.pageContent);
  const metadatas = chunks.map((c, i) => ({
    page: c.metadata?.loc?.pageNumber ?? i,
  }));

  await collection.upsert({
    ids,
    embeddings,
    documents,
    metadatas,
  });

  console.log(`[RAG] Stored ${chunks.length} chunks in "${collectionName}"`);

  return collection;
};

// ================= RETRIEVE =================
export const retrieveFromChroma = async (collectionName, query) => {
  const client = getChromaClient();

  const collection = await client.getCollection({
    name: collectionName,
    embeddingFunction: null,
  });

  const queryEmbedding = await embedText(query);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: TOP_K_RESULTS,
  });

  const chunks = results.documents[0] ?? [];
  return chunks;
};

// ================= DELETE =================
export const deleteCollection = async (collectionName) => {
  try {
    const client = getChromaClient();
    await client.deleteCollection({ name: collectionName });
    console.log(`[RAG] Deleted collection: ${collectionName}`);
  } catch (err) {
    console.warn("⚠️ Delete failed:", err.message);
  }
};

// ================= MASTER PIPELINE =================
export const buildChromaCollection = async (filePath, collectionName) => {
  const rawDocs = await loadPdf(filePath);
  const chunks = await chunkDocuments(rawDocs);
  await storeInChroma(chunks, collectionName);
  return collectionName;
};