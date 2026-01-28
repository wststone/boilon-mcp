import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Cloud,
	CloudRain,
	Loader2,
	Search,
	Sun,
	Thermometer,
	Wind,
} from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import type { WeatherData, WeatherForecast } from "@/mcp/types";
import { $getCurrentWeather, $getWeatherForecast } from "@/server/weather";

export const Route = createFileRoute("/dashboard/weather")({
	component: WeatherPage,
});

const WEEK_MAP: Record<string, string> = {
	"1": "周一",
	"2": "周二",
	"3": "周三",
	"4": "周四",
	"5": "周五",
	"6": "周六",
	"7": "周日",
};

function getWeatherIcon(weather: string) {
	if (weather.includes("晴")) return <Sun className="w-5 h-5 text-amber-400" />;
	if (weather.includes("雨") || weather.includes("雪"))
		return <CloudRain className="w-5 h-5 text-blue-400" />;
	return <Cloud className="w-5 h-5 text-gray-400" />;
}

function WeatherPage() {
	const [city, setCity] = useState("");

	const currentMutation = useMutation({
		mutationKey: ["weather", "current"],
		mutationFn: (params: { city: string }) =>
			$getCurrentWeather({ data: { city: params.city } }),
	});

	const forecastMutation = useMutation({
		mutationKey: ["weather", "forecast"],
		mutationFn: (params: { city: string }) =>
			$getWeatherForecast({ data: { city: params.city } }),
	});

	const isLoading = currentMutation.isPending || forecastMutation.isPending;
	const currentData: WeatherData | undefined = currentMutation.data;
	const forecastData: WeatherForecast | undefined = forecastMutation.data;
	const error = currentMutation.error || forecastMutation.error;
	const hasSearched = !currentMutation.isIdle;

	const handleSearch = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			const trimmed = city.trim();
			if (!trimmed) return;
			currentMutation.mutate({ city: trimmed });
			forecastMutation.mutate({ city: trimmed });
		},
		[city, currentMutation, forecastMutation],
	);

	return (
		<div className="space-y-8">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-foreground">天气查询</h1>
				<p className="text-muted-foreground mt-1">
					输入城市名称或 adcode 查询实时天气和未来预报（数据来自高德地图）
				</p>
			</div>

			{/* Search Form */}
			<form onSubmit={handleSearch} className="flex gap-3">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
					<Input
						placeholder="输入城市名称，如：北京、深圳、110000..."
						value={city}
						onChange={(e) => setCity(e.target.value)}
						className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground/60"
						disabled={isLoading}
					/>
				</div>
				<Button
					type="submit"
					disabled={isLoading || !city.trim()}
					className="bg-cyan-500 hover:bg-cyan-600"
				>
					{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "查询"}
				</Button>
			</form>

			{/* Error */}
			{error && (
				<div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
					{error.message || "查询失败，请稍后重试"}
				</div>
			)}

			{/* Current Weather */}
			{currentData && !currentMutation.isPending && (
				<div className="bg-card border border-border rounded-xl p-6">
					<div className="flex items-center gap-2 mb-4">
						<Thermometer className="w-5 h-5 text-cyan-500" />
						<h2 className="text-lg font-semibold text-foreground">实时天气</h2>
						<span className="text-sm text-muted-foreground ml-auto">
							{currentData.reporttime}
						</span>
					</div>

					<div className="flex items-center gap-6">
						{/* 温度 */}
						<div className="text-center">
							<div className="text-5xl font-bold text-foreground">
								{currentData.temperature}
								<span className="text-2xl text-muted-foreground">°C</span>
							</div>
							<div className="mt-1 flex items-center justify-center gap-1.5">
								{getWeatherIcon(currentData.weather)}
								<span className="text-muted-foreground">
									{currentData.weather}
								</span>
							</div>
						</div>

						{/* 分隔线 */}
						<div className="h-20 w-px bg-border" />

						{/* 详情 */}
						<div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground">城市</span>
								<span className="font-medium text-foreground">
									{currentData.province} {currentData.city}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground">区域编码</span>
								<span className="font-medium text-foreground">
									{currentData.adcode}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<Wind className="w-4 h-4 text-muted-foreground" />
								<span className="text-muted-foreground">风向</span>
								<span className="font-medium text-foreground">
									{currentData.winddirection}风 {currentData.windpower}级
								</span>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground">湿度</span>
								<span className="font-medium text-foreground">
									{currentData.humidity}%
								</span>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Forecast */}
			{forecastData && !forecastMutation.isPending && (
				<div className="bg-card border border-border rounded-xl p-6">
					<div className="flex items-center gap-2 mb-4">
						<Cloud className="w-5 h-5 text-cyan-500" />
						<h2 className="text-lg font-semibold text-foreground">天气预报</h2>
						<span className="text-sm text-muted-foreground ml-auto">
							{forecastData.province} {forecastData.city}
						</span>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						{forecastData.casts.map((cast) => (
							<div
								key={cast.date}
								className="bg-muted/50 border border-border rounded-lg p-4 space-y-3"
							>
								{/* 日期 */}
								<div className="flex items-center justify-between">
									<span className="font-medium text-foreground">
										{cast.date}
									</span>
									<span className="text-sm text-muted-foreground">
										{WEEK_MAP[cast.week] ?? cast.week}
									</span>
								</div>

								{/* 白天 */}
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-1.5">
										{getWeatherIcon(cast.dayweather)}
										<span className="text-sm text-foreground">
											{cast.dayweather}
										</span>
									</div>
									<span className="text-sm font-medium text-foreground">
										{cast.daytemp}°C
									</span>
								</div>

								{/* 夜间 */}
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-1.5">
										{getWeatherIcon(cast.nightweather)}
										<span className="text-sm text-muted-foreground">
											{cast.nightweather}
										</span>
									</div>
									<span className="text-sm text-muted-foreground">
										{cast.nighttemp}°C
									</span>
								</div>

								{/* 风向 */}
								<div className="flex items-center gap-1 text-xs text-muted-foreground">
									<Wind className="w-3.5 h-3.5" />
									<span>
										{cast.daywind}风 {cast.daypower}级
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Initial State */}
			{!hasSearched && !isLoading && (
				<Empty className="py-16 bg-card border border-border rounded-xl">
					<EmptyHeader>
						<EmptyMedia>
							<Cloud className="w-10 h-10 text-muted-foreground/60" />
						</EmptyMedia>
						<EmptyTitle>查询天气信息</EmptyTitle>
						<EmptyDescription>
							输入城市名称或行政区划代码，获取实时天气和未来预报
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}

			{/* Loading State */}
			{isLoading && (
				<div className="flex items-center justify-center py-16">
					<Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
				</div>
			)}
		</div>
	);
}
