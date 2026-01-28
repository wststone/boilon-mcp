import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { NewsArticle, NewsSearchResult } from "../types";

const BOCHA_API_KEY = process.env.BOCHA_API_KEY;
const BOCHA_API_URL = "https://api.bochaai.com/v1/web-search";

/**
 * Freshness options for news search
 */
const FRESHNESS_OPTIONS = [
	"oneDay",
	"oneWeek",
	"oneMonth",
	"oneYear",
	"noLimit",
] as const;

type FreshnessOption = (typeof FRESHNESS_OPTIONS)[number];

/**
 * Fetch news from Bocha AI Search API
 */
async function fetchNews(params: {
	query: string;
	freshness?: FreshnessOption;
	count?: number;
	summary?: boolean;
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
			summary: params.summary ?? true,
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

/**
 * Mock news data for demo when no API key is configured
 */
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

/**
 * News categories for topic-based search
 */
const NEWS_CATEGORIES: Record<string, string> = {
	tech: "科技 技术 互联网 AI 人工智能",
	finance: "财经 金融 股市 投资 经济",
	sports: "体育 足球 篮球 赛事",
	entertainment: "娱乐 明星 电影 音乐",
	health: "健康 医疗 养生",
	education: "教育 学校 考试",
	auto: "汽车 新能源车 电动车",
	travel: "旅游 出行 景点",
	food: "美食 餐饮 食品",
	gaming: "游戏 电竞 手游",
};

/**
 * 在 McpServer 上注册新闻相关工具
 */
export function registerNewsTools(server: McpServer) {
	const useRealApi = !!BOCHA_API_KEY;

	// Tool: Search news
	server.tool(
		"search_news",
		"搜索新闻，支持关键词搜索和自然语言查询",
		{
			query: z
				.string()
				.describe("搜索关键词或自然语言查询（如：'最新AI技术进展'）"),
			freshness: z
				.enum(["oneDay", "oneWeek", "oneMonth", "oneYear", "noLimit"])
				.optional()
				.default("oneWeek")
				.describe(
					"时间范围：oneDay-一天内，oneWeek-一周内，oneMonth-一月内，oneYear-一年内，noLimit-不限",
				),
			count: z
				.number()
				.optional()
				.default(10)
				.describe("返回结果数量（1-50，默认10）"),
		},
		async ({
			query,
			freshness,
			count,
		}): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
			const resultCount = Math.min(Math.max(count, 1), 50);
			let result: NewsSearchResult;

			if (useRealApi) {
				try {
					result = await fetchNews({
						query,
						freshness,
						count: resultCount,
						summary: true,
					});
				} catch {
					result = getMockNews(query, resultCount);
					(result as NewsSearchResult & { note: string }).note =
						"使用模拟数据（API 调用失败）";
				}
			} else {
				result = getMockNews(query, resultCount);
				(result as NewsSearchResult & { note: string }).note =
					"演示模式 - 设置 BOCHA_API_KEY 获取真实数据";
			}

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(result),
					},
				],
			};
		},
	);

	// Tool: Get latest news by topic
	server.tool(
		"get_news_by_topic",
		"按主题分类获取新闻（科技、财经、体育、娱乐等）",
		{
			topic: z
				.enum([
					"tech",
					"finance",
					"sports",
					"entertainment",
					"health",
					"education",
					"auto",
					"travel",
					"food",
					"gaming",
				])
				.describe(
					"新闻主题：tech-科技，finance-财经，sports-体育，entertainment-娱乐，health-健康，education-教育，auto-汽车，travel-旅游，food-美食，gaming-游戏",
				),
			count: z
				.number()
				.optional()
				.default(10)
				.describe("返回结果数量（1-50，默认10）"),
		},
		async ({
			topic,
			count,
		}): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
			const resultCount = Math.min(Math.max(count, 1), 50);
			const topicQuery = NEWS_CATEGORIES[topic] || topic;
			let result: NewsSearchResult;

			if (useRealApi) {
				try {
					result = await fetchNews({
						query: `${topicQuery} 最新新闻`,
						freshness: "oneWeek",
						count: resultCount,
						summary: true,
					});
					result.topic = topic;
				} catch {
					result = getMockNews(topicQuery, resultCount);
					result.topic = topic;
					(result as NewsSearchResult & { note: string }).note =
						"使用模拟数据（API 调用失败）";
				}
			} else {
				result = getMockNews(topicQuery, resultCount);
				result.topic = topic;
				(result as NewsSearchResult & { note: string }).note =
					"演示模式 - 设置 BOCHA_API_KEY 获取真实数据";
			}

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(result),
					},
				],
			};
		},
	);

	// Tool: Get headline news
	server.tool(
		"get_headlines",
		"获取今日头条新闻",
		{
			count: z
				.number()
				.optional()
				.default(10)
				.describe("返回结果数量（1-20，默认10）"),
		},
		async ({
			count,
		}): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
			const resultCount = Math.min(Math.max(count, 1), 20);
			let result: NewsSearchResult;

			if (useRealApi) {
				try {
					result = await fetchNews({
						query: "今日要闻 热点新闻 头条",
						freshness: "oneDay",
						count: resultCount,
						summary: true,
					});
					result.category = "headlines";
				} catch {
					result = getMockNews("今日要闻", resultCount);
					result.category = "headlines";
					(result as NewsSearchResult & { note: string }).note =
						"使用模拟数据（API 调用失败）";
				}
			} else {
				result = getMockNews("今日要闻", resultCount);
				result.category = "headlines";
				(result as NewsSearchResult & { note: string }).note =
					"演示模式 - 设置 BOCHA_API_KEY 获取真实数据";
			}

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(result),
					},
				],
			};
		},
	);

	// Tool: Get trending news
	server.tool(
		"get_trending",
		"获取热门趋势新闻",
		{
			count: z
				.number()
				.optional()
				.default(10)
				.describe("返回结果数量（1-20，默认10）"),
		},
		async ({
			count,
		}): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
			const resultCount = Math.min(Math.max(count, 1), 20);
			let result: NewsSearchResult;

			if (useRealApi) {
				try {
					result = await fetchNews({
						query: "热搜 热门话题 trending",
						freshness: "oneDay",
						count: resultCount,
						summary: true,
					});
					result.category = "trending";
				} catch {
					result = getMockNews("热门话题", resultCount);
					result.category = "trending";
					(result as NewsSearchResult & { note: string }).note =
						"使用模拟数据（API 调用失败）";
				}
			} else {
				result = getMockNews("热门话题", resultCount);
				result.category = "trending";
				(result as NewsSearchResult & { note: string }).note =
					"演示模式 - 设置 BOCHA_API_KEY 获取真实数据";
			}

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(result),
					},
				],
			};
		},
	);

}

/**
 * Creates and configures the News MCP server powered by Bocha AI
 */
export function createNewsServer(_organizationId: string, _userId: string): McpServer {
	const server = new McpServer({
		name: "boilon-news",
		version: "1.0.0",
	});

	registerNewsTools(server);

	return server;
}
