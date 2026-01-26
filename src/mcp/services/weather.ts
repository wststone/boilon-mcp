import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { WeatherAlert, WeatherData, WeatherForecast } from "../types";

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

/**
 * Fetch weather data from OpenWeatherMap API
 */
async function fetchWeather(
	endpoint: string,
	params: Record<string, string>,
): Promise<unknown> {
	const url = new URL(`${OPENWEATHER_BASE_URL}/${endpoint}`);
	url.searchParams.set("appid", OPENWEATHER_API_KEY || "demo");
	url.searchParams.set("units", "metric");

	for (const [key, value] of Object.entries(params)) {
		url.searchParams.set(key, value);
	}

	const response = await fetch(url.toString());

	if (!response.ok) {
		throw new Error(`Weather API error: ${response.statusText}`);
	}

	return response.json();
}

/**
 * Get wind direction from degrees
 */
function getWindDirection(degrees: number): string {
	const directions = [
		"N",
		"NNE",
		"NE",
		"ENE",
		"E",
		"ESE",
		"SE",
		"SSE",
		"S",
		"SSW",
		"SW",
		"WSW",
		"W",
		"WNW",
		"NW",
		"NNW",
	];
	const index = Math.round(degrees / 22.5) % 16;
	return directions[index];
}

/**
 * Mock weather data for demo when no API key
 */
function getMockCurrentWeather(location: string): WeatherData {
	const temp = 15 + Math.random() * 15; // 15-30°C
	return {
		location,
		temperature: Math.round(temp * 10) / 10,
		feelsLike: Math.round((temp - 2 + Math.random() * 4) * 10) / 10,
		humidity: Math.round(40 + Math.random() * 40),
		description: ["Sunny", "Partly cloudy", "Cloudy", "Light rain"][
			Math.floor(Math.random() * 4)
		],
		windSpeed: Math.round(5 + Math.random() * 20),
		windDirection: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][
			Math.floor(Math.random() * 8)
		],
		pressure: Math.round(1000 + Math.random() * 30),
		visibility: Math.round(8 + Math.random() * 12),
		uvIndex: Math.round(Math.random() * 11),
		sunrise: "06:30",
		sunset: "18:45",
	};
}

/**
 * Mock forecast data for demo
 */
function getMockForecast(location: string, days: number): WeatherForecast {
	const forecasts = [];
	const today = new Date();

	for (let i = 0; i < days; i++) {
		const date = new Date(today);
		date.setDate(date.getDate() + i);

		forecasts.push({
			date: date.toISOString().split("T")[0],
			high: Math.round(20 + Math.random() * 15),
			low: Math.round(10 + Math.random() * 10),
			description: [
				"Sunny",
				"Partly cloudy",
				"Cloudy",
				"Rain",
				"Thunderstorms",
			][Math.floor(Math.random() * 5)],
			precipitation: Math.round(Math.random() * 100),
			humidity: Math.round(40 + Math.random() * 40),
			windSpeed: Math.round(5 + Math.random() * 25),
		});
	}

	return { location, forecasts };
}

/**
 * Mock alerts for demo
 */
function getMockAlerts(location: string): WeatherAlert[] {
	// 30% chance of having an alert
	if (Math.random() > 0.3) {
		return [];
	}

	const alerts: WeatherAlert[] = [
		{
			id: "alert-1",
			event: "Heat Advisory",
			headline: "Heat Advisory in effect",
			description:
				"High temperatures expected. Stay hydrated and avoid prolonged outdoor activities.",
			severity: "moderate",
			start: new Date().toISOString(),
			end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
			areas: [location],
		},
	];

	return alerts;
}

// ============================================
// Exported data functions (used by server functions and MCP tools)
// ============================================

type WeatherDataWithNote = WeatherData & { note?: string };
type WeatherForecastWithNote = WeatherForecast & { note?: string };
type WeatherAlertsResult = {
	location: string;
	alerts: WeatherAlert[];
	count: number;
	note?: string;
};

/**
 * 获取当前天气数据
 */
export async function fetchCurrentWeatherData(
	location: string,
): Promise<WeatherDataWithNote> {
	const useRealApi = !!OPENWEATHER_API_KEY;

	if (useRealApi) {
		try {
			const data = (await fetchWeather("weather", { q: location })) as {
				name: string;
				main: {
					temp: number;
					feels_like: number;
					humidity: number;
					pressure: number;
				};
				weather: Array<{ description: string }>;
				wind: { speed: number; deg: number };
				visibility: number;
				sys: { sunrise: number; sunset: number };
			};

			return {
				location: data.name,
				temperature: data.main.temp,
				feelsLike: data.main.feels_like,
				humidity: data.main.humidity,
				description: data.weather[0]?.description || "Unknown",
				windSpeed: data.wind.speed,
				windDirection: getWindDirection(data.wind.deg),
				pressure: data.main.pressure,
				visibility: data.visibility / 1000, // Convert to km
				sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString(),
				sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString(),
			};
		} catch {
			return {
				...getMockCurrentWeather(location),
				note: "Using mock data due to API error",
			};
		}
	}

	return {
		...getMockCurrentWeather(location),
		note: "Demo mode - set OPENWEATHER_API_KEY for real data",
	};
}

/**
 * 获取天气预报数据
 */
export async function fetchForecastData(
	location: string,
	days = 5,
): Promise<WeatherForecastWithNote> {
	const useRealApi = !!OPENWEATHER_API_KEY;
	const forecastDays = Math.min(Math.max(days, 1), 7);

	if (useRealApi) {
		try {
			const data = (await fetchWeather("forecast", {
				q: location,
				cnt: String(forecastDays * 8),
			})) as {
				city: { name: string };
				list: Array<{
					dt_txt: string;
					main: { temp_max: number; temp_min: number; humidity: number };
					weather: Array<{ description: string }>;
					wind: { speed: number };
					pop: number;
				}>;
			};

			// Group by day and extract daily highs/lows
			const dailyData = new Map<
				string,
				{
					highs: number[];
					lows: number[];
					descriptions: string[];
					precipitation: number[];
					humidity: number[];
					windSpeed: number[];
				}
			>();

			for (const item of data.list) {
				const date = item.dt_txt.split(" ")[0];
				if (!dailyData.has(date)) {
					dailyData.set(date, {
						highs: [],
						lows: [],
						descriptions: [],
						precipitation: [],
						humidity: [],
						windSpeed: [],
					});
				}
				const day = dailyData.get(date)!;
				day.highs.push(item.main.temp_max);
				day.lows.push(item.main.temp_min);
				day.descriptions.push(item.weather[0]?.description || "");
				day.precipitation.push(item.pop * 100);
				day.humidity.push(item.main.humidity);
				day.windSpeed.push(item.wind.speed);
			}

			const forecasts = Array.from(dailyData.entries())
				.slice(0, forecastDays)
				.map(([date, day]) => ({
					date,
					high: Math.round(Math.max(...day.highs)),
					low: Math.round(Math.min(...day.lows)),
					description:
						day.descriptions[Math.floor(day.descriptions.length / 2)],
					precipitation: Math.round(
						day.precipitation.reduce((a, b) => a + b, 0) /
							day.precipitation.length,
					),
					humidity: Math.round(
						day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length,
					),
					windSpeed: Math.round(
						day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length,
					),
				}));

			return {
				location: data.city.name,
				forecasts,
			};
		} catch {
			return {
				...getMockForecast(location, forecastDays),
				note: "Using mock data due to API error",
			};
		}
	}

	return {
		...getMockForecast(location, forecastDays),
		note: "Demo mode - set OPENWEATHER_API_KEY for real data",
	};
}

/**
 * 获取气象预警数据
 */
export async function fetchWeatherAlertsData(
	location: string,
): Promise<WeatherAlertsResult> {
	// OpenWeatherMap One Call API 3.0 is needed for alerts (paid)
	// Using mock data for demo
	const alerts = getMockAlerts(location);

	return {
		location,
		alerts,
		count: alerts.length,
		note: "Demo mode - alerts are simulated",
	};
}

/**
 * 根据坐标获取天气数据
 */
export async function fetchWeatherByCoords(
	lat: number,
	lon: number,
): Promise<WeatherDataWithNote> {
	const useRealApi = !!OPENWEATHER_API_KEY;

	if (useRealApi) {
		try {
			const data = (await fetchWeather("weather", {
				lat: String(lat),
				lon: String(lon),
			})) as {
				name: string;
				main: {
					temp: number;
					feels_like: number;
					humidity: number;
					pressure: number;
				};
				weather: Array<{ description: string }>;
				wind: { speed: number; deg: number };
				visibility: number;
				sys: { sunrise: number; sunset: number };
			};

			return {
				location: data.name,
				temperature: data.main.temp,
				feelsLike: data.main.feels_like,
				humidity: data.main.humidity,
				description: data.weather[0]?.description || "Unknown",
				windSpeed: data.wind.speed,
				windDirection: getWindDirection(data.wind.deg),
				pressure: data.main.pressure,
				visibility: data.visibility / 1000,
				sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString(),
				sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString(),
			};
		} catch {
			return {
				...getMockCurrentWeather(`${lat}, ${lon}`),
				note: "Using mock data due to API error",
			};
		}
	}

	return {
		...getMockCurrentWeather(`${lat}, ${lon}`),
		note: "Demo mode - set OPENWEATHER_API_KEY for real data",
	};
}

// ============================================
// MCP Server
// ============================================

/**
 * Creates and configures the Weather MCP server
 */
export function createWeatherServer(_organizationId: string): McpServer {
	const server = new McpServer({
		name: "boilon-weather",
		version: "1.0.0",
	});

	// Tool: Get current weather
	server.tool(
		"get_current_weather",
		"Get current weather conditions for a location",
		{
			location: z
				.string()
				.describe("City name or location (e.g., 'London', 'New York, US')"),
		},
		async ({
			location,
		}): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
			const weatherData = await fetchCurrentWeatherData(location);
			return {
				content: [{ type: "text", text: JSON.stringify(weatherData) }],
			};
		},
	);

	// Tool: Get weather forecast
	server.tool(
		"get_forecast",
		"Get weather forecast for a location",
		{
			location: z
				.string()
				.describe("City name or location (e.g., 'London', 'New York, US')"),
			days: z
				.number()
				.optional()
				.default(5)
				.describe("Number of days to forecast (1-7)"),
		},
		async ({
			location,
			days,
		}): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
			const forecastData = await fetchForecastData(location, days);
			return {
				content: [{ type: "text", text: JSON.stringify(forecastData) }],
			};
		},
	);

	// Tool: Get weather alerts
	server.tool(
		"get_weather_alerts",
		"Get active weather alerts for a location",
		{
			location: z
				.string()
				.describe("City name or location (e.g., 'London', 'New York, US')"),
		},
		async ({
			location,
		}): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
			const alertsData = await fetchWeatherAlertsData(location);
			return {
				content: [{ type: "text", text: JSON.stringify(alertsData) }],
			};
		},
	);

	// Tool: Get weather for coordinates
	server.tool(
		"get_weather_by_coordinates",
		"Get current weather for specific coordinates",
		{
			lat: z.number().describe("Latitude (-90 to 90)"),
			lon: z.number().describe("Longitude (-180 to 180)"),
		},
		async ({
			lat,
			lon,
		}): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
			const weatherData = await fetchWeatherByCoords(lat, lon);
			return {
				content: [{ type: "text", text: JSON.stringify(weatherData) }],
			};
		},
	);

	return server;
}
