import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	fetchCurrentWeatherData,
	fetchForecastData,
} from "@/mcp/services/weather";
import { sessionAuthMiddleware } from "@/middleware/api-auth";

// ============================================
// Schemas
// ============================================

const currentWeatherSchema = z.object({
	city: z.string().min(1, "请输入城市名称"),
});

const forecastSchema = z.object({
	city: z.string().min(1, "请输入城市名称"),
});

// ============================================
// Server Functions
// ============================================

/**
 * 获取实时天气
 */
export const $getCurrentWeather = createServerFn({
	method: "POST",
})
	.middleware([sessionAuthMiddleware])
	.handler(async (ctx) => {
		const input = currentWeatherSchema.parse(
			(ctx as unknown as { data: z.infer<typeof currentWeatherSchema> }).data,
		);
		return fetchCurrentWeatherData(input.city);
	});

/**
 * 获取天气预报
 */
export const $getWeatherForecast = createServerFn({
	method: "POST",
})
	.middleware([sessionAuthMiddleware])
	.handler(async (ctx) => {
		const input = forecastSchema.parse(
			(ctx as unknown as { data: z.infer<typeof forecastSchema> }).data,
		);
		return fetchForecastData(input.city);
	});
