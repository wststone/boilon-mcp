import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Clock,
	ExternalLink,
	Loader2,
	Newspaper,
	Search,
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { NewsSearchResult } from "@/mcp/types";
import { $searchNews } from "@/server/news";

export const Route = createFileRoute("/dashboard/news")({
	component: NewsPage,
});

const FRESHNESS_OPTIONS = [
	{ value: "oneDay", label: "一天内" },
	{ value: "oneWeek", label: "一周内" },
	{ value: "oneMonth", label: "一月内" },
	{ value: "oneYear", label: "一年内" },
	{ value: "noLimit", label: "不限" },
] as const;

type FreshnessValue = (typeof FRESHNESS_OPTIONS)[number]["value"];

function formatPublishDate(dateStr?: string) {
	if (!dateStr) return null;
	try {
		const date = new Date(dateStr);
		const now = Date.now();
		const diffMs = now - date.getTime();
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffHours < 1) return "刚刚";
		if (diffHours < 24) return `${diffHours} 小时前`;
		if (diffDays < 7) return `${diffDays} 天前`;
		return date.toLocaleDateString("zh-CN", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	} catch {
		return null;
	}
}

function NewsPage() {
	const [query, setQuery] = useState("");
	const [freshness, setFreshness] = useState<FreshnessValue>("oneWeek");

	const searchMutation = useMutation({
		mutationKey: ["news", "search"],
		mutationFn: (params: { query: string; freshness: FreshnessValue }) =>
			$searchNews({
				data: {
					query: params.query,
					freshness: params.freshness,
				},
			}),
	});

	const isSearching = searchMutation.isPending;
	const error = searchMutation.error;
	const result: NewsSearchResult | undefined = searchMutation.data;
	const articles = result?.articles ?? [];
	const hasSearched = !searchMutation.isIdle;

	const handleSearch = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			if (!query.trim()) return;
			searchMutation.mutate({ query: query.trim(), freshness });
		},
		[query, freshness, searchMutation],
	);

	return (
		<div className="space-y-8">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-foreground">新闻搜索</h1>
				<p className="text-muted-foreground mt-1">
					搜索新闻资讯，支持关键词搜索和自然语言查询
				</p>
			</div>

			{/* Search Form */}
			<form onSubmit={handleSearch} className="flex gap-3">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
					<Input
						placeholder="输入关键词或问题搜索新闻..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground/60"
						disabled={isSearching}
					/>
				</div>
				<Select
					value={freshness}
					onValueChange={(v) => setFreshness(v as FreshnessValue)}
				>
					<SelectTrigger className="w-[120px] bg-muted border-border">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{FRESHNESS_OPTIONS.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Button
					type="submit"
					disabled={isSearching || !query.trim()}
					className="bg-cyan-500 hover:bg-cyan-600"
				>
					{isSearching ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						"搜索"
					)}
				</Button>
			</form>

			{/* Error */}
			{error && (
				<div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
					{error.message || "搜索失败，请稍后重试"}
				</div>
			)}

			{/* Results */}
			{hasSearched && !isSearching && (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-medium text-muted-foreground">
							搜索结果 ({articles.length})
						</h3>
					</div>

					{articles.length === 0 ? (
						<Empty className="py-12 bg-card border border-border rounded-xl">
							<EmptyHeader>
								<EmptyMedia>
									<Search className="w-10 h-10 text-muted-foreground/60" />
								</EmptyMedia>
								<EmptyTitle>未找到相关新闻</EmptyTitle>
								<EmptyDescription>
									尝试使用不同的关键词或调整时间范围
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					) : (
						<div className="space-y-4">
							{articles.map((article) => {
								const publishDate = formatPublishDate(
									article.publishedAt,
								);
								return (
									<div
										key={article.id}
										className="bg-card border border-border rounded-xl p-5 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all"
									>
										{/* Title */}
										<a
											href={article.url}
											target="_blank"
											rel="noopener noreferrer"
											className="group flex items-start gap-2"
										>
											<h4 className="text-base font-semibold text-foreground group-hover:text-orange-500 transition-colors leading-snug">
												{article.title}
											</h4>
											<ExternalLink className="w-4 h-4 text-muted-foreground/40 group-hover:text-orange-500 shrink-0 mt-0.5" />
										</a>

										{/* Meta */}
										<div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
											{article.sourceIcon && (
												<img
													src={article.sourceIcon}
													alt=""
													className="w-4 h-4 rounded-sm"
												/>
											)}
											<span className="font-medium">
												{article.source}
											</span>
											{publishDate && (
												<>
													<span className="text-muted-foreground/30">
														·
													</span>
													<span className="flex items-center gap-1">
														<Clock className="w-3.5 h-3.5" />
														{publishDate}
													</span>
												</>
											)}
										</div>

										{/* Snippet / Summary */}
										<p className="text-sm text-foreground/70 mt-3 leading-relaxed line-clamp-3">
											{article.summary || article.snippet}
										</p>
									</div>
								);
							})}
						</div>
					)}
				</div>
			)}

			{/* Initial State */}
			{!hasSearched && !isSearching && (
				<Empty className="py-16 bg-card border border-border rounded-xl">
					<EmptyHeader>
						<EmptyMedia>
							<Newspaper className="w-10 h-10 text-muted-foreground/60" />
						</EmptyMedia>
						<EmptyTitle>搜索新闻资讯</EmptyTitle>
						<EmptyDescription>
							输入关键词或自然语言问题，获取最新的新闻报道
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}

			{/* Loading State */}
			{isSearching && (
				<div className="flex items-center justify-center py-16">
					<Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
				</div>
			)}
		</div>
	);
}
