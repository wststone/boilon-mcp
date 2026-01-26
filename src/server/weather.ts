import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sessionAuthMiddleware } from "@/middleware/api-auth";
import {
	fetchCurrentWeatherData,
	fetchForecastData,
	fetchWeatherAlertsData,
	fetchWeatherByCoords,
} from "@/mcp/services/weather";

// ============================================
// Schemas
// ============================================

const currentWeatherSchema = z.object({
	location: z.string().min(1, "请输入城市名称"),
});

const forecastSchema = z.object({
	location: z.string().min(1, "请输入城市名称"),
	days: z.number().min(1).max(7).optional().default(5),
});

const alertsSchema = z.object({
	location: z.string().min(1, "请输入城市名称"),
});

const coordsSchema = z.object({
	lat: z.number().min(-90).max(90),
	lon: z.number().min(-180).max(180),
});

// ============================================
// Server Functions
// ============================================

/**
 * 获取当前天气
 */
export const $getCurrentWeather = createServerFn({
	method: "POST",
})
	.middleware([sessionAuthMiddleware])
	.handler(async (ctx) => {
		const input = currentWeatherSchema.parse(
			(ctx as unknown as { data: z.infer<typeof currentWeatherSchema> }).data,
		);
		return fetchCurrentWeatherData(input.location);
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
		return fetchForecastData(input.location, input.days);
	});

/**
 * 获取气象预警
 */
export const $getWeatherAlerts = createServerFn({
	method: "POST",
})
	.middleware([sessionAuthMiddleware])
	.handler(async (ctx) => {
		const input = alertsSchema.parse(
			(ctx as unknown as { data: z.infer<typeof alertsSchema> }).data,
		);
		return fetchWeatherAlertsData(input.location);
	});

/**
 * 根据坐标获取天气
 */
export const $getWeatherByCoordinates = createServerFn({
	method: "POST",
})
	.middleware([sessionAuthMiddleware])
	.handler(async (ctx) => {
		const input = coordsSchema.parse(
			(ctx as unknown as { data: z.infer<typeof coordsSchema> }).data,
		);
		return fetchWeatherByCoords(input.lat, input.lon);
	});
