import { useState } from "react";
import { Copy, FileText, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface SearchResult {
	chunkId: string;
	content: string;
	similarity: number;
	documentTitle: string | null;
	fileName: string;
	fileId: string;
	chunkIndex: number;
}

interface SearchInterfaceProps {
	onSearch: (query: string) => Promise<SearchResult[]>;
	disabled?: boolean;
}

export function SearchInterface({
	onSearch,
	disabled = false,
}: SearchInterfaceProps) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [error, setError] = useState("");
	const [hasSearched, setHasSearched] = useState(false);

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!query.trim()) return;

		setIsSearching(true);
		setError("");
		setHasSearched(true);

		try {
			const searchResults = await onSearch(query.trim());
			setResults(searchResults);
		} catch (err) {
			setError(err instanceof Error ? err.message : "搜索失败");
			setResults([]);
		} finally {
			setIsSearching(false);
		}
	};

	const handleCopy = async (content: string) => {
		await navigator.clipboard.writeText(content);
	};

	const formatSimilarity = (similarity: number) => {
		return `${Math.round(similarity * 100)}%`;
	};

	return (
		<div className="space-y-6">
			{/* Search Form */}
			<form onSubmit={handleSearch} className="flex gap-3">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
					<Input
						placeholder="输入问题进行语义搜索..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground/60"
						disabled={disabled || isSearching}
					/>
				</div>
				<Button
					type="submit"
					disabled={disabled || isSearching || !query.trim()}
					className="bg-cyan-500 hover:bg-cyan-600"
				>
					{isSearching ? (
						<Loader2 className="w-4 h-4 animate-spin" />
					) : (
						"搜索"
					)}
				</Button>
			</form>

			{/* Error Message */}
			{error && (
				<div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
					{error}
				</div>
			)}

			{/* Search Results */}
			{hasSearched && !isSearching && (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-medium text-muted-foreground">
							搜索结果 ({results.length})
						</h3>
					</div>

					{results.length === 0 ? (
						<div className="text-center py-12 bg-card border border-border rounded-xl">
							<Search className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
							<p className="text-muted-foreground">未找到相关内容</p>
							<p className="text-sm text-muted-foreground/60 mt-1">
								尝试使用不同的关键词或问题
							</p>
						</div>
					) : (
						<div className="space-y-4">
							{results.map((result, index) => (
								<div
									key={result.chunkId}
									className="bg-card border border-border rounded-xl overflow-hidden"
								>
									{/* Header */}
									<div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card">
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
												<FileText className="w-4 h-4 text-muted-foreground" />
											</div>
											<div>
												<p className="text-sm font-medium text-foreground">
													{result.documentTitle || result.fileName}
												</p>
												<p className="text-xs text-muted-foreground">
													{result.fileName} · 片段 {result.chunkIndex + 1}
												</p>
											</div>
										</div>
										<div className="flex items-center gap-3">
											<span
												className={`px-2.5 py-1 rounded-full text-xs font-medium ${
													result.similarity >= 0.8
														? "bg-emerald-500/10 text-emerald-400"
														: result.similarity >= 0.6
															? "bg-cyan-500/10 text-cyan-400"
															: "bg-amber-500/10 text-amber-400"
												}`}
											>
												相似度 {formatSimilarity(result.similarity)}
											</span>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleCopy(result.content)}
												className="text-muted-foreground hover:text-foreground hover:bg-muted"
											>
												<Copy className="w-4 h-4" />
											</Button>
										</div>
									</div>

									{/* Content */}
									<div className="p-4">
										<p className="text-sm text-foreground/70 whitespace-pre-wrap leading-relaxed">
											{result.content}
										</p>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Initial State */}
			{!hasSearched && (
				<div className="text-center py-12 bg-card border border-border rounded-xl">
					<Search className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
					<p className="text-muted-foreground">输入问题开始搜索</p>
					<p className="text-sm text-muted-foreground/60 mt-1">
						使用自然语言描述你想要查找的内容
					</p>
				</div>
			)}
		</div>
	);
}
