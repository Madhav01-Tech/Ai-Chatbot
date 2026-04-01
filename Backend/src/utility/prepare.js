import fs from "fs";
import path from "path";
import { pipeline } from "@huggingface/transformers";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChromaClient } from "chromadb";


const CHUNK_SIZE      = 500;
const CHUNK_OVERLAP   = 100;
const TOP_K_RESULTS   = 2;
const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";


let embedder = null;

const getEmbedder = async () => {
  if (!embedder) {
    console.log("[RAG] Loading HuggingFace embedding model...");
    embedder = await pipeline("feature-extraction", EMBEDDING_MODEL);
    console.log("[RAG] Embedding model ready.");
  }
  return embedder;
};


let chromaClient = null;

const getChromaClient = () => {
  if (!chromaClient) {

     chromaClient = new ChromaClient({
      ssl:      true,
      host:     "api.trychroma.com",
      port:     443,
      tenant:   process.env.CHROMA_TENANT,
      database: process.env.CHROMA_DATABASE,
      headers:  { "x-chroma-token": process.env.CHROMA_API_KEY },
    });
  }
  return chromaClient;
};


export const loadPdf = async (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`PDF not found: ${filePath}`);
  }

  const loader  = new PDFLoader(filePath);
  const rawDocs = await loader.load(); // text of pdf

  if (!rawDocs || rawDocs.length === 0) {
    throw new Error("PDF is empty or could not be parsed.");
  }

  console.log(`[RAG] Loaded ${rawDocs.length} page(s) from: ${path.basename(filePath)}`);
  return rawDocs;
};


// Step 2 · Split into chunks

export const chunkDocuments = async (rawDocs) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize:    CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });

  const chunks = await splitter.splitDocuments(rawDocs);
  
  return chunks;
};


// Step 3 · Embed a single text string using HuggingFace

export const embedText = async (text) => {
  const embed  = await getEmbedder();
  const output = await embed(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
};


// Step 4 · Embed all chunks and upsert into ChromaDB
export const storeInChroma = async (chunks, collectionName) => {
  const client = getChromaClient();

  //  getOrCreateCollection — correct for storing
  const collection = await client.getOrCreateCollection({
    name: collectionName,
    metadata:  { "hnsw:space": "cosine" },
    embeddingFunction: null, // we provide our own embeddings
  });

  const ids        = [];
  const embeddings = [];
  const documents  = [];
  const metadatas  = [];

 
// embed each chunk and prepare data for upsert
  for (let i = 0; i < chunks.length; i++) {
    const text = chunks[i].pageContent;
    const embedding = await embedText(text);

    ids.push(`chunk-${i}`);
    embeddings.push(embedding);
    documents.push(text);
    metadatas.push({ page: chunks[i].metadata?.loc?.pageNumber ?? i });
  }

  await collection.upsert({ ids, embeddings, documents, metadatas });
  console.log(`[RAG] Stored ${chunks.length} chunk(s) in ChromaDB collection: "${collectionName}".`);

  return collection;
};


export const retrieveFromChroma = async (collectionName, query) => {
  const client = getChromaClient();

  //  getCollection — correct for querying existing collection
  const collection = await client.getCollection({
    name:   collectionName,
    embeddingFunction: null,
  });

  const queryEmbedding = await embedText(query);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults:  TOP_K_RESULTS,
  });

  const chunks = results.documents[0] ?? [];
  
  return chunks;
};


// Step 6 · Delete a collection (cleanup after session)

export const deleteCollection = async (collectionName) => {
  try {
    const client = getChromaClient();
    await client.deleteCollection({ name: collectionName });
    console.log(`[RAG] Deleted ChromaDB collection: "${collectionName}".`);
  } catch (err) {
    console.warn(`[RAG] Could not delete collection "${collectionName}":`, err.message);
  }
};


// Master helper · PDF → chunks → embed → store

export const buildChromaCollection = async (filePath, collectionName) => {
  const rawDocs = await loadPdf(filePath);
  const chunks  = await chunkDocuments(rawDocs);
  await storeInChroma(chunks, collectionName);
  return collectionName;
};