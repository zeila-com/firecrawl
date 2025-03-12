import { createOpenAI } from '@ai-sdk/openai';
import { createOllama } from "ollama-ai-provider";
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const modelAdapter = process.env.OLLAMA_BASE_URL ? createOllama({
    baseURL: process.env.OLLAMA_BASE_URL,
}) : process.env.GEMINI_API_KEY ? createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
}) : createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
});

export function getModel(name: string) {
    return process.env.MODEL_NAME ? modelAdapter(process.env.MODEL_NAME) : modelAdapter(name);
}

export function getEmbeddingModel(name: string) {
    return process.env.MODEL_EMBEDDING_NAME ? modelAdapter.embedding(process.env.MODEL_EMBEDDING_NAME) : modelAdapter.embedding(name);
}