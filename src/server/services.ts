import { createServerFn } from "@tanstack/react-start";
import { and, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { apiUsage, mcpServiceConfig } from "@/db/schema";
import { sessionAuthMiddleware } from "@/middleware/api-auth";

// ============================================
// 服务定义（静态元数据）
// ============================================

const SERVICE_DEFINITIONS = {
	rag: {
		name: "RAG 知识库",
		description:
			"语义文档搜索和检索服务。上传知识库文档，让设备能够智能回答问题。",
		endpoint: "/mcp/rag",
		tools: [
			"search_documents",
			"add_document",
			"list_documents",
			"delete_document",
			"get_document",
		],
	},
	weather: {
		name: "天气服务",
		description:
			"实时天气数据和预报服务。获取当前天气、多日预报和气象预警。",
		endpoint: "/mcp/weather",
		tools: [
			"get_current_weather",
			"get_forecast",
			"get_weather_alerts",
			"get_weather_by_coordinates",
		],
	},
	music: {
		name: "音乐发现",
		description:
			"音乐搜索和推荐服务。搜索歌曲、查询歌手信息和获取个性化推荐。",
		endpoint: "/mcp/music",
		tools: [
			"search_tracks",
			"get_artist",
			"get_recommendations",
			"get_genres",
			"get_top_charts",
		],
	},
	news: {
		name: "新闻资讯",
		description:
			"基于博查AI的智能新闻搜索服务。支持关键词搜索、分类浏览、头条和热门趋势。",
		endpoint: "/mcp/news",
		tools: [
			"search_news",
			"get_news_by_topic",
			"get_headlines",
			"get_trending",
		],
	},
} as const;

export type ServiceId = keyof typeof SERVICE_DEFINITIONS;

// ============================================
// Server Functions
// ============================================

/**
 * 获取所有服务的配置和使用统计
 */
export const $listServices = createServerFn({ method: "GET" })
	.middleware([sessionAuthMiddleware])
	.handler(async ({ context }) => {
		const organizationId = context.session.activeOrganizationId;

		// 获取当前组织的服务配置
		const configs = organizationId
			? await db
					.select()
					.from(mcpServiceConfig)
					.where(eq(mcpServiceConfig.organizationId, organizationId))
				: [];

		// 获取本月使用统计
		const startOfMonth = new Date();
		startOfMonth.setDate(1);
		startOfMonth.setHours(0, 0, 0, 0);

		const usageStats = organizationId
			? await db
					.select({
						service: apiUsage.service,
						totalCalls:
							sql<number>`coalesce(sum(${apiUsage.requestCount}), 0)`.as(
								"total_calls",
							),
						totalTokens:
							sql<number>`coalesce(sum(${apiUsage.tokensUsed}), 0)`.as(
								"total_tokens",
							),
					})
					.from(apiUsage)
					.where(
						and(
							eq(apiUsage.organizationId, organizationId),
							gte(apiUsage.timestamp, startOfMonth),
						),
					)
					.groupBy(apiUsage.service)
				: [];

		// 构建配置和统计的映射
		const configMap = new Map(configs.map((c) => [c.service, c]));
		const statsMap = new Map(usageStats.map((s) => [s.service, s]));

		return Object.entries(SERVICE_DEFINITIONS).map(([id, def]) => {
			const config = configMap.get(id);
			const stats = statsMap.get(id);

			return {
				id: id as ServiceId,
				name: def.name,
				description: def.description,
				endpoint: def.endpoint,
				tools: [...def.tools],
				enabled: config?.enabled ?? true,
				stats: {
					monthlyCalls: Number(stats?.totalCalls ?? 0),
					monthlyTokens: Number(stats?.totalTokens ?? 0),
				},
			};
		});
	});

/**
 * 切换服务的启用/禁用状态
 */
export const $toggleService = createServerFn({ method: "POST" })
	.middleware([sessionAuthMiddleware])
	.inputValidator(
		z.object({
			serviceId: z.string(),
			enabled: z.boolean(),
		}),
	)
	.handler(async ({ context, data }) => {
		const organizationId = context.session.activeOrganizationId;
		if (!organizationId) {
			throw new Error("请先选择组织");
		}

		const { serviceId, enabled } = data;

		// 查找现有配置
		const [existing] = await db
			.select()
			.from(mcpServiceConfig)
			.where(
				and(
					eq(mcpServiceConfig.organizationId, organizationId),
					eq(mcpServiceConfig.service, serviceId),
				),
			)
			.limit(1);

		if (existing) {
			// 更新现有配置
			await db
				.update(mcpServiceConfig)
				.set({ enabled, updatedAt: new Date() })
				.where(eq(mcpServiceConfig.id, existing.id));
		} else {
			// 创建新配置
			await db.insert(mcpServiceConfig).values({
				organizationId,
				service: serviceId,
				enabled,
			});
		}

		return { success: true };
	});
