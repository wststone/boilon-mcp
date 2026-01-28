import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { NewsArticle, NewsSearchResult } from "@/mcp/types";
import { sessionAuthMiddleware } from "@/middleware/api-auth";

const BOCHA_API_KEY = process.env.BOCHA_API_KEY;
const BOCHA_API_URL = "https://api.bochaai.com/v1/web-search";

const FRESHNESS_OPTIONS = [
	"oneDay",
	"oneWeek",
	"oneMonth",
	"oneYear",
	"noLimit",
] as const;

type FreshnessOption = (typeof FRESHNESS_OPTIONS)[number];

// ============================================
// API 调用
// ============================================

async function fetchNews(params: {
	query: string;
	freshness?: FreshnessOption;
	count?: number;
}): Promise<NewsSearchResult> {
	const response = await fetch(BOCHA_API_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${BOCHA_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			query: params.query,
			freshness: params.freshness || "oneWeek",
			summary: true,
			count: params.count || 10,
		}),
	});

	if (!response.ok) {
		throw new Error(`Bocha API error: ${response.statusText}`);
	}

	const data = (await response.json()) as {
		code: number;
		log_id: string;
		msg: string | null;
		data: {
			_type: string;
			queryContext: { originalQuery: string };
			webPages?: {
				webSearchUrl: string;
				totalEstimatedMatches: number;
				value: Array<{
					id: string;
					name: string;
					url: string;
					siteName: string;
					siteIcon?: string;
					snippet: string;
					summary?: string;
					datePublished?: string;
				}>;
			};
			images?: {
				id: string | null;
				webSearchUrl: string | null;
				readLink: string | null;
				value: Array<{
					webSearchUrl: string | null;
					name: string | null;
					thumbnailUrl: string | null;
					datePublished: string | null;
				}>;
			};
		};
	};

	const searchData = data.data;

	const articles: NewsArticle[] =
		searchData?.webPages?.value?.map((item) => ({
			id: item.id,
			title: item.name,
			url: item.url,
			source: item.siteName,
			sourceIcon: item.siteIcon,
			snippet: item.snippet,
			summary: item.summary,
			publishedAt: item.datePublished,
		})) || [];

	return {
		query: searchData?.queryContext?.originalQuery || params.query,
		articles,
		totalResults: articles.length,
	};
}

// ============================================
// Schema
// ============================================

const searchNewsSchema = z.object({
	query: z.string().min(1, "请输入搜索关键词"),
	freshness: z.enum(FRESHNESS_OPTIONS).optional(),
	count: z.number().min(1).max(50).optional(),
});

// ============================================
// Server Function
// ============================================

/**
 * 搜索新闻
 */
export const $searchNews = createServerFn({
	method: "POST",
})
	.middleware([sessionAuthMiddleware])
	.inputValidator(searchNewsSchema)
	.handler(async ({ data }) => {
		const { query, freshness = "oneWeek", count = 10 } = data;
		const resultCount = Math.min(Math.max(count, 1), 50);

		const newsReuslt = await fetchNews({
			query,
			freshness,
			count: resultCount,
		});

		return newsReuslt;
	});
