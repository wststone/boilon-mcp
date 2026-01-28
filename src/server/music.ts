import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	getArtistData,
	getGenresData,
	getRecommendationsData,
	getTopChartsData,
	searchTracksData,
} from "@/mcp/services/music";
import { sessionAuthMiddleware } from "@/middleware/api-auth";

// ============================================
// Schemas
// ============================================

const searchTracksSchema = z.object({
	query: z.string().min(1, "请输入搜索关键词"),
	limit: z.number().min(1).max(50).optional().default(10),
});

const getArtistSchema = z.object({
	name: z.string().min(1, "请输入歌手名称"),
});

const recommendationsSchema = z.object({
	seedArtists: z.array(z.string()).optional(),
	seedGenres: z.array(z.string()).optional(),
	limit: z.number().min(1).max(50).optional().default(10),
});

const genresSchema = z.object({
	parentGenre: z.string().optional(),
});

const topChartsSchema = z.object({
	country: z.string().optional().default("global"),
	limit: z.number().min(1).max(50).optional().default(10),
});

// ============================================
// Server Functions
// ============================================

/**
 * 搜索歌曲
 */
export const $searchTracks = createServerFn({
	method: "POST",
})
	.middleware([sessionAuthMiddleware])
	.handler(async (ctx) => {
		const input = searchTracksSchema.parse(
			(ctx as unknown as { data: z.infer<typeof searchTracksSchema> }).data,
		);
		return searchTracksData(input.query, input.limit);
	});

/**
 * 获取歌手信息
 */
export const $getArtist = createServerFn({
	method: "POST",
})
	.middleware([sessionAuthMiddleware])
	.handler(async (ctx) => {
		const input = getArtistSchema.parse(
			(ctx as unknown as { data: z.infer<typeof getArtistSchema> }).data,
		);
		return getArtistData(input.name);
	});

/**
 * 获取音乐推荐
 */
export const $getRecommendations = createServerFn({
	method: "POST",
})
	.middleware([sessionAuthMiddleware])
	.handler(async (ctx) => {
		const input = recommendationsSchema.parse(
			(ctx as unknown as { data: z.infer<typeof recommendationsSchema> }).data,
		);
		return getRecommendationsData(
			input.seedArtists,
			input.seedGenres,
			input.limit,
		);
	});

/**
 * 获取曲风分类
 */
export const $getGenres = createServerFn({
	method: "POST",
})
	.middleware([sessionAuthMiddleware])
	.handler(async (ctx) => {
		const input = genresSchema.parse(
			(ctx as unknown as { data: z.infer<typeof genresSchema> }).data,
		);
		return getGenresData(input.parentGenre);
	});

/**
 * 获取热门排行
 */
export const $getTopCharts = createServerFn({
	method: "POST",
})
	.middleware([sessionAuthMiddleware])
	.handler(async (ctx) => {
		const input = topChartsSchema.parse(
			(ctx as unknown as { data: z.infer<typeof topChartsSchema> }).data,
		);
		return getTopChartsData(input.country, input.limit);
	});
