import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { WeatherData, WeatherForecast } from "../types";

const AMAP_API_KEY = process.env.AMAP_API_KEY;
const AMAP_WEATHER_URL = "https://restapi.amap.com/v3/weather/weatherInfo";

// ============================================
// Amap API 响应类型
// ============================================

type AmapLiveItem = {
	province: string;
	city: string;
	adcode: string;
	weather: string;
	temperature: string;
	winddirection: string;
	windpower: string;
	humidity: string;
	reporttime: string;
	temperature_float: string;
	humidity_float: string;
};

type AmapCastItem = {
	date: string;
	week: string;
	dayweather: string;
	nightweather: string;
	daytemp: string;
	nighttemp: string;
	daywind: string;
	nightwind: string;
	daypower: string;
	nightpower: string;
	daytemp_float: string;
	nighttemp_float: string;
};

type AmapBaseResponse = {
	status: string;
	count: string;
	info: string;
	infocode: string;
	lives: AmapLiveItem[];
};

type AmapAllResponse = {
	status: string;
	count: string;
	info: string;
	infocode: string;
	forecasts: Array<{
		city: string;
		adcode: string;
		province: string;
		reporttime: string;
		casts: AmapCastItem[];
	}>;
};

// ============================================
// 数据获取函数
// ============================================

/**
 * 调用高德天气 API
 */
async function fetchAmapWeather(
	city: string,
	extensions: "base" | "all",
): Promise<unknown> {
	const url = new URL(AMAP_WEATHER_URL);
	url.searchParams.set("key", AMAP_API_KEY || "");
	url.searchParams.set("city", city);
	url.searchParams.set("extensions", extensions);
	url.searchParams.set("output", "JSON");

	const response = await fetch(url.toString());

	if (!response.ok) {
		throw new Error(`高德天气 API 错误: ${response.statusText}`);
	}

	const data = await response.json();

	if (data.status !== "1") {
		throw new Error(`高德天气 API 错误: ${data.info} (${data.infocode})`);
	}

	return data;
}

// ============================================
// 导出的数据函数（供 server functions 和 MCP tools 使用）
// ============================================

type WeatherDataWithNote = WeatherData & { note?: string };
type WeatherForecastWithNote = WeatherForecast & { note?: string };

/**
 * 获取实时天气数据
 */
export async function fetchCurrentWeatherData(
	city: string,
): Promise<WeatherDataWithNote> {
	if (!AMAP_API_KEY) {
		throw new Error("未配置 AMAP_API_KEY 环境变量");
	}

	const data = (await fetchAmapWeather(city, "base")) as AmapBaseResponse;
	const live = data.lives[0];

	if (!live) {
		throw new Error(`未找到城市 "${city}" 的天气数据`);
	}

	return {
		province: live.province,
		city: live.city,
		adcode: live.adcode,
		weather: live.weather,
		temperature: Number.parseFloat(live.temperature),
		winddirection: live.winddirection,
		windpower: live.windpower,
		humidity: Number.parseFloat(live.humidity),
		reporttime: live.reporttime,
	};
}

/**
 * 获取天气预报数据（未来4天）
 */
export async function fetchForecastData(
	city: string,
): Promise<WeatherForecastWithNote> {
	if (!AMAP_API_KEY) {
		throw new Error("未配置 AMAP_API_KEY 环境变量");
	}

	const data = (await fetchAmapWeather(city, "all")) as AmapAllResponse;
	const forecast = data.forecasts[0];

	if (!forecast) {
		throw new Error(`未找到城市 "${city}" 的预报数据`);
	}

	return {
		province: forecast.province,
		city: forecast.city,
		adcode: forecast.adcode,
		reporttime: forecast.reporttime,
		casts: forecast.casts.map((cast) => ({
			date: cast.date,
			week: cast.week,
			dayweather: cast.dayweather,
			nightweather: cast.nightweather,
			daytemp: Number.parseFloat(cast.daytemp),
			nighttemp: Number.parseFloat(cast.nighttemp),
			daywind: cast.daywind,
			nightwind: cast.nightwind,
			daypower: cast.daypower,
			nightpower: cast.nightpower,
		})),
	};
}

// ============================================
// MCP Server
// ============================================

/**
 * Creates and configures the Weather MCP server (高德地图)
 */
export function createWeatherServer(
	_organizationId: string,
	_userId: string,
): McpServer {
	const server = new McpServer({
		name: "boilon-weather",
		version: "1.0.0",
	});

	// Tool: 获取实时天气
	server.tool(
		"get_current_weather",
		"获取指定城市的实时天气（基于高德地图）",
		{
			city: z.string().describe("城市名称或 adcode（如：'北京'、'110000'）"),
		},
		async ({
			city,
		}): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
			const weatherData = await fetchCurrentWeatherData(city);
			return {
				content: [{ type: "text", text: JSON.stringify(weatherData) }],
			};
		},
	);

	// Tool: 获取天气预报
	server.tool(
		"get_forecast",
		"获取指定城市的未来天气预报（基于高德地图，最多4天）",
		{
			city: z.string().describe("城市名称或 adcode（如：'北京'、'110000'）"),
		},
		async ({
			city,
		}): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
			const forecastData = await fetchForecastData(city);
			return {
				content: [{ type: "text", text: JSON.stringify(forecastData) }],
			};
		},
	);

	return server;
}
