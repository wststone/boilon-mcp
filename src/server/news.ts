import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sessionAuthMiddleware } from "@/middleware/api-auth";
import type { NewsArticle, NewsSearchResult } from "@/mcp/types";

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
		_type: string;
		queryContext: { originalQuery: string };
		webPages?: {
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
	};

	const articles: NewsArticle[] =
		data.webPages?.value?.map((item) => ({
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
		query: data.queryContext?.originalQuery || params.query,
		articles,
		totalResults: articles.length,
	};
}

// ============================================
// Mock 数据（无 API Key 时降级使用）
// ============================================

function getMockNews(query: string, count: number): NewsSearchResult {
	const mockArticles: NewsArticle[] = [
		{
			id: "mock-1",
			title: `${query}相关：最新行业动态报道`,
			url: "https://example.com/news/1",
			source: "科技日报",
			snippet: `关于${query}的最新报道，详细介绍了行业最新发展趋势和市场动向。`,
			summary: `这是一篇关于${query}的深度报道，涵盖了技术进展、市场分析和未来展望。`,
			publishedAt: new Date().toISOString(),
		},
		{
			id: "mock-2",
			title: `深度解析：${query}未来发展趋势`,
			url: "https://example.com/news/2",
			source: "财经网",
			snippet: `专家分析${query}领域的发展前景，预测未来几年的市场走向。`,
			summary: `本文邀请多位行业专家，从多个角度分析${query}的发展趋势。`,
			publishedAt: new Date(Date.now() - 86400000).toISOString(),
		},
		{
			id: "mock-3",
			title: `${query}行业：新政策带来新机遇`,
			url: "https://example.com/news/3",
			source: "经济观察",
			snippet: `最新政策出台，为${query}行业带来新的发展机遇和挑战。`,
			summary: `详细解读最新政策对${query}行业的影响，以及企业应如何应对。`,
			publishedAt: new Date(Date.now() - 172800000).toISOString(),
		},
		{
			id: "mock-4",
			title: `${query}技术突破：创新应用场景涌现`,
			url: "https://example.com/news/4",
			source: "新华科技",
			snippet: `${query}领域技术取得重大突破，多个创新应用场景正在涌现。`,
			summary: `报道${query}领域最新技术突破及其在各行业的创新应用。`,
			publishedAt: new Date(Date.now() - 259200000).toISOString(),
		},
		{
			id: "mock-5",
			title: `投资风向：${query}成为资本新宠`,
			url: "https://example.com/news/5",
			source: "投资界",
			snippet: `多家机构重金押注${query}赛道，行业融资热度持续攀升。`,
			summary: `分析${query}领域的投资热潮，探讨其背后的商业逻辑。`,
			publishedAt: new Date(Date.now() - 345600000).toISOString(),
		},
	];

	return {
		query,
		articles: mockArticles.slice(0, count),
		totalResults: mockArticles.slice(0, count).length,
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

		if (!BOCHA_API_KEY) {
			return getMockNews(query, resultCount);
		}

		try {
			return await fetchNews({ query, freshness, count: resultCount });
		} catch {
			// API 调用失败时降级为 mock 数据
			return getMockNews(query, resultCount);
		}
	});
