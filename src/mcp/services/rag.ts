import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { ragDocuments } from "@/db/schema";
import type { RagDocument, RagSearchResult } from "../types";

/**
 * Simple cosine similarity for basic vector search
 */
function cosineSimilarity(a: number[], b: number[]): number {
	if (a.length !== b.length) return 0;
	let dotProduct = 0;
	let normA = 0;
	let normB = 0;
	for (let i = 0; i < a.length; i++) {
		dotProduct += a[i] * b[i];
		normA += a[i] * a[i];
		normB += b[i] * b[i];
	}
	return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Simple text-to-vector embedding using TF-IDF-like approach
 * In production, use a proper embedding model
 */
function textToVector(text: string, vocabulary: string[]): number[] {
	const words = text.toLowerCase().split(/\s+/);
	const wordCounts = new Map<string, number>();

	for (const word of words) {
		wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
	}

	return vocabulary.map((word) => {
		const count = wordCounts.get(word) || 0;
		return count / words.length; // Normalized term frequency
	});
}

/**
 * Build vocabulary from documents
 */
function buildVocabulary(texts: string[]): string[] {
	const wordSet = new Set<string>();
	for (const text of texts) {
		const words = text.toLowerCase().split(/\s+/);
		for (const word of words) {
			if (word.length > 2) {
				wordSet.add(word);
			}
		}
	}
	return Array.from(wordSet).slice(0, 1000); // Limit vocabulary size
}

/**
 * Creates and configures the RAG MCP server
 */
export function createRagServer(organizationId: string): McpServer {
	const server = new McpServer({
		name: "boilon-rag",
		version: "1.0.0",
	});

	// Tool: Search documents
	server.tool(
		"search_documents",
		"Search through documents using semantic search",
		{
			query: z.string().describe("The search query"),
			limit: z
				.number()
				.optional()
				.default(5)
				.describe("Maximum number of results to return"),
		},
		async ({
			query,
			limit,
		}): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
			// Get all documents for this organization
			const docs = await db
				.select()
				.from(ragDocuments)
				.where(eq(ragDocuments.organizationId, organizationId));

			if (docs.length === 0) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								documents: [],
								query,
								totalResults: 0,
								message:
									"No documents found. Add documents first using add_document.",
							} satisfies RagSearchResult & { message: string }),
						},
					],
				};
			}

			// Build vocabulary and search
			const texts = docs.map((d) => `${d.title} ${d.content}`);
			const vocabulary = buildVocabulary(texts);
			const queryVector = textToVector(query, vocabulary);

			// Calculate similarities
			const results: RagDocument[] = docs
				.map((doc) => {
					const docVector = textToVector(
						`${doc.title} ${doc.content}`,
						vocabulary,
					);
					const similarity = cosineSimilarity(queryVector, docVector);
					return {
						id: doc.id,
						title: doc.title,
						content: doc.content,
						metadata: doc.metadata || {},
						similarity,
					};
				})
				.filter((doc) => doc.similarity > 0.1) // Filter low relevance
				.sort((a, b) => b.similarity - a.similarity)
				.slice(0, limit);

			// Also do keyword search as fallback
			const keywordResults = await db
				.select()
				.from(ragDocuments)
				.where(
					or(
						ilike(ragDocuments.title, `%${query}%`),
						ilike(ragDocuments.content, `%${query}%`),
					),
				)
				.limit(limit);

			// Merge results, preferring semantic matches
			const seenIds = new Set(results.map((r) => r.id));
			for (const doc of keywordResults) {
				if (!seenIds.has(doc.id)) {
					results.push({
						id: doc.id,
						title: doc.title,
						content: doc.content,
						metadata: doc.metadata || {},
						similarity: 0.5, // Give keyword matches a middle score
					});
				}
			}

			const finalResults = results.slice(0, limit);

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({
							documents: finalResults,
							query,
							totalResults: finalResults.length,
						} satisfies RagSearchResult),
					},
				],
			};
		},
	);

	// Tool: Add document
	server.tool(
		"add_document",
		"Add a new document to the knowledge base",
		{
			title: z.string().describe("Document title"),
			content: z.string().describe("Document content"),
			metadata: z
				.record(z.unknown())
				.optional()
				.describe("Optional metadata for the document"),
		},
		async ({
			title,
			content,
			metadata,
		}): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
			const [newDoc] = await db
				.insert(ragDocuments)
				.values({
					organizationId,
					title,
					content,
					metadata: metadata || {},
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({
							success: true,
							document: {
								id: newDoc.id,
								title: newDoc.title,
								content:
									newDoc.content.length > 200
										? `${newDoc.content.slice(0, 200)}...`
										: newDoc.content,
								metadata: newDoc.metadata,
							},
							message: `Document "${title}" added successfully`,
						}),
					},
				],
			};
		},
	);

	// Tool: List documents
	server.tool(
		"list_documents",
		"List all documents in the knowledge base",
		{
			limit: z
				.number()
				.optional()
				.default(20)
				.describe("Maximum number of documents to return"),
			offset: z
				.number()
				.optional()
				.default(0)
				.describe("Number of documents to skip"),
		},
		async ({
			limit,
			offset,
		}): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
			const docs = await db
				.select({
					id: ragDocuments.id,
					title: ragDocuments.title,
					createdAt: ragDocuments.createdAt,
					metadata: ragDocuments.metadata,
				})
				.from(ragDocuments)
				.where(eq(ragDocuments.organizationId, organizationId))
				.orderBy(desc(ragDocuments.createdAt))
				.limit(limit)
				.offset(offset);

			const totalCount = await db
				.select()
				.from(ragDocuments)
				.where(eq(ragDocuments.organizationId, organizationId));

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({
							documents: docs,
							total: totalCount.length,
							limit,
							offset,
						}),
					},
				],
			};
		},
	);

	// Tool: Delete document
	server.tool(
		"delete_document",
		"Delete a document from the knowledge base",
		{
			id: z.number().describe("Document ID to delete"),
		},
		async ({
			id,
		}): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
			const [deleted] = await db
				.delete(ragDocuments)
				.where(eq(ragDocuments.id, id))
				.returning();

			if (!deleted) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								success: false,
								error: "Document not found",
							}),
						},
					],
				};
			}

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({
							success: true,
							message: `Document "${deleted.title}" deleted successfully`,
						}),
					},
				],
			};
		},
	);

	// Tool: Get document
	server.tool(
		"get_document",
		"Get a specific document by ID",
		{
			id: z.number().describe("Document ID to retrieve"),
		},
		async ({
			id,
		}): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
			const [doc] = await db
				.select()
				.from(ragDocuments)
				.where(eq(ragDocuments.id, id))
				.limit(1);

			if (!doc) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								success: false,
								error: "Document not found",
							}),
						},
					],
				};
			}

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({
							document: {
								id: doc.id,
								title: doc.title,
								content: doc.content,
								metadata: doc.metadata,
								createdAt: doc.createdAt,
								updatedAt: doc.updatedAt,
							},
						}),
					},
				],
			};
		},
	);

	return server;
}
