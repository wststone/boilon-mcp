import { createServerFn } from "@tanstack/react-start";
import {
	and,
	count,
	desc,
	eq,
	gte,
	inArray,
	isNull,
	lt,
	or,
	sql,
} from "drizzle-orm";
import { db } from "@/db";
import { apikeys, apiUsage, members } from "@/db/schema";
import { sessionAuthMiddleware } from "@/middleware/api-auth";

/**
 * 构建 api_usage 的所有权过滤条件
 * 有组织时按组织过滤，否则按用户的 API 密钥过滤
 */
function buildUsageOwnerFilter(
	organizationId: string | null | undefined,
	userId: string,
) {
	if (organizationId) {
		return eq(apiUsage.organizationId, organizationId);
	}

	return inArray(
		apiUsage.apiKeyId,
		db
			.select({ id: apikeys.id })
			.from(apikeys)
			.where(eq(apikeys.userId, userId)),
	);
}

function calcChange(current: number, previous: number) {
	if (previous === 0) return current > 0 ? 100 : 0;

	return Math.round(((current - previous) / previous) * 1000) / 10;
}

// ============================================
// Server Functions
// ============================================

/**
 * 获取控制台统计数据（4 张卡片）
 */
export const $getDashboardStats = createServerFn({ method: "GET" })
	.middleware([sessionAuthMiddleware])
	.handler(async ({ context }) => {
		const { userId } = context;
		const organizationId = context.session.activeOrganizationId;

		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

		const ownerFilter = buildUsageOwnerFilter(organizationId, userId);

		const [
			[thisMonthUsage],
			[lastMonthUsage],
			[activeKeysResult],
			teamMembersResult,
		] = await Promise.all([
			// 本月调用次数和令牌
			db
				.select({
					calls: sql<number>`coalesce(sum(${apiUsage.requestCount}), 0)`.as(
						"calls",
					),
					tokens: sql<number>`coalesce(sum(${apiUsage.tokensUsed}), 0)`.as(
						"tokens",
					),
				})
				.from(apiUsage)
				.where(and(ownerFilter, gte(apiUsage.timestamp, startOfMonth))),

			// 上月调用次数和令牌
			db
				.select({
					calls: sql<number>`coalesce(sum(${apiUsage.requestCount}), 0)`.as(
						"calls",
					),
					tokens: sql<number>`coalesce(sum(${apiUsage.tokensUsed}), 0)`.as(
						"tokens",
					),
				})
				.from(apiUsage)
				.where(
					and(
						ownerFilter,
						gte(apiUsage.timestamp, startOfLastMonth),
						lt(apiUsage.timestamp, startOfMonth),
					),
				),

			// 活跃密钥数（已启用且未过期）
			db
				.select({ count: count() })
				.from(apikeys)
				.where(
					and(
						eq(apikeys.userId, userId),
						eq(apikeys.enabled, true),
						or(isNull(apikeys.expiresAt), gte(apikeys.expiresAt, now)),
					),
				),

			// 团队成员数
			organizationId
				? db
						.select({ count: count() })
						.from(members)
						.where(eq(members.organizationId, organizationId))
				: Promise.resolve([{ count: 1 }]),
		]);

		const thisMonthCalls = Number(thisMonthUsage?.calls ?? 0);
		const lastMonthCalls = Number(lastMonthUsage?.calls ?? 0);
		const thisMonthTokens = Number(thisMonthUsage?.tokens ?? 0);
		const lastMonthTokens = Number(lastMonthUsage?.tokens ?? 0);

		return {
			apiCalls: {
				value: thisMonthCalls,
				change: calcChange(thisMonthCalls, lastMonthCalls),
			},
			activeKeys: {
				value: activeKeysResult?.count ?? 0,
			},
			teamMembers: {
				value: teamMembersResult[0]?.count ?? 1,
			},
			monthlyTokens: {
				value: thisMonthTokens,
				change: calcChange(thisMonthTokens, lastMonthTokens),
			},
		};
	});

/**
 * 获取最近 API 活动记录
 */
export const $getRecentActivity = createServerFn({ method: "GET" })
	.middleware([sessionAuthMiddleware])
	.handler(async ({ context }) => {
		const { userId } = context;
		const organizationId = context.session.activeOrganizationId;
		const ownerFilter = buildUsageOwnerFilter(organizationId, userId);

		const activities = await db
			.select({
				service: apiUsage.service,
				tool: apiUsage.tool,
				timestamp: apiUsage.timestamp,
			})
			.from(apiUsage)
			.where(ownerFilter)
			.orderBy(desc(apiUsage.timestamp))
			.limit(10);

		return activities;
	});
