import fs from "fs";
import path from "path";

import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createRequire } from "module";
import Tesseract from "tesseract.js";

import { pipeline } from "@huggingface/transformers";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChromaClient } from "chromadb";

// ================= CONFIG =================
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 100;
const TOP_K_RESULTS = 3;
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

/*export const embedBatch = async (texts) => {
  const embed = await getEmbedder();

  const outputs = await embed(texts, {
    pooling: "mean",
    normalize: true,
  });

  return outputs.map(e => Array.from(e.data));
};*/

export const embedBatch = async (texts) => {
  const embed = await getEmbedder();

  const outputs = await embed(texts, {
    pooling: "mean",
    normalize: true,
  });

 // if output array return as it is , otherwise covert single output to array (for backward compatibility)
  if (Array.isArray(outputs)) {
    return outputs.map(e =>
      Array.isArray(e) ? e : Array.from(e.data || e)
    );
  }

  // single output case
  return [Array.from(outputs.data || outputs)];
};

// ================= OCR =================
const extractTextWithOCR = async (filePath) => {
  ;

  const { data } = await Tesseract.recognize(filePath, "eng", {
    logger: (m) => console.log("[OCR]", m.status),
  });

  return data.text;
};

// ================= PDF LOADER =================
export const loadPdf = async (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`PDF not found: ${filePath}`);
  }

 

  // ===== Try pdfjs =====
  try {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const pdf = await pdfjsLib.getDocument({ data }).promise; // binary to text extraction

    let docs = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      const text = content.items
        .map(item => item.str)
        .filter(Boolean)
        .join(" ");

      if (text.trim().length > 0) {
        docs.push({
          pageContent: text,
          metadata: { loc: { pageNumber: i } },
        });
      }
    }

    if (docs.length > 0) {
    return docs;
    }

    console.warn("⚠️ Empty PDF → switching to OCR");

  } catch (err) {
    console.warn("⚠️ pdfjs failed:", err.message);
  }

  // ===== OCR Fallback =====
  const text = await extractTextWithOCR(filePath);

  if (!text || text.trim().length === 0) {
    throw new Error("OCR failed: No text found");
  }

  return [
    {
      pageContent: text,
      metadata: { loc: { pageNumber: 1 } },
    },
  ];
};

// ================= CHUNKING =================
export const chunkDocuments = async (rawDocs) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: ["\n\n", "\n", ".", " ", ""],
  });

  const chunks = await splitter.splitDocuments(rawDocs);

  
  return chunks;
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



export const storeInChroma = async (chunks, collectionName, fileName) => {
  const client = getChromaClient();

  const collection = await client.getOrCreateCollection({
    name: collectionName,
    metadata: { "hnsw:space": "cosine" },
    embeddingFunction: null,
  });

  

  const validDocs = [];
  const embeddings = [];

  for (let i = 0; i < chunks.length; i++) {
    const text = chunks[i].pageContent;

    try {
      const [embedding] = await embedBatch([text]);

      // ✅ skip bad embeddings
      if (!embedding || embedding.length === 0) continue;

      validDocs.push({
        text,
        page: chunks[i].metadata?.loc?.pageNumber ?? i,
      });

      embeddings.push(embedding);

    } catch (err) {
      console.warn("⚠️ Skipping chunk:", i);
    }
  }

  // 🔥 Now everything is aligned
  const ids = validDocs.map((_, i) => `${fileName}-chunk-${i}`);
  const documents = validDocs.map(d => d.text);
  const metadatas = validDocs.map(d => ({
    page: d.page,
    source: fileName,
  }));

  if (
    ids.length !== embeddings.length ||
    ids.length !== documents.length
  ) {
    throw new Error("Data mismatch before Chroma insert");
  }

  await collection.upsert({
    ids,
    embeddings,
    documents,
    metadatas,
  });

  

  return collection;
};

// ================= RETRIEVE =================
export const retrieveFromChroma = async (collectionName, query) => {
  const client = getChromaClient();

  const collection = await client.getCollection({
    name: collectionName,
    embeddingFunction: null,
  });

  const [queryEmbedding] = await embedBatch([query]);

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: TOP_K_RESULTS,
  });

  const docs = results.documents?.[0] ?? [];
  const metas = results.metadatas?.[0] ?? [];

  return docs.map((text, i) => ({
    text,
    source: metas[i]?.source,
    page: metas[i]?.page,
  }));
};


// ================= DELETE =================
export const deleteCollection = async (collectionName) => {
  try {
    const client = getChromaClient();
    await client.deleteCollection({ name: collectionName });
    
  } catch (err) {
    console.warn("⚠️ Delete failed:", err.message);
  }
};

// ================= BUILD PIPELINE =================
export const buildChromaCollection = async (filePath, collectionName) => {
  const fileName = path.basename(filePath);

  const rawDocs = await loadPdf(filePath);
  const chunks = await chunkDocuments(rawDocs);

  await storeInChroma(chunks, collectionName, fileName);

  return collectionName;
};