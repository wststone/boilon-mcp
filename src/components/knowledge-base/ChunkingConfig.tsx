import { Info, RotateCcw } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldSet,
	FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export type ChunkingStrategy = "character" | "token";

export type ChunkingPreset = "default" | "fine" | "coarse" | "custom";

export interface ChunkingConfigValue {
	strategy: ChunkingStrategy;
	chunkSize: number;
	chunkOverlap: number;
	separators: string[];
}

interface ChunkingConfigProps {
	value: ChunkingConfigValue;
	onChange: (value: ChunkingConfigValue) => void;
	disabled?: boolean;
	className?: string;
}

const ALL_SEPARATORS = [
	{ value: "\n\n", label: "段落", description: "双换行" },
	{ value: "\n", label: "换行", description: "单换行" },
	{ value: "。", label: "句号（中）", description: "中文句号" },
	{ value: ".", label: "句号（英）", description: "英文句号" },
	{ value: "！", label: "感叹号（中）", description: "中文感叹号" },
	{ value: "!", label: "感叹号（英）", description: "英文感叹号" },
	{ value: "？", label: "问号（中）", description: "中文问号" },
	{ value: "?", label: "问号（英）", description: "英文问号" },
	{ value: "；", label: "分号（中）", description: "中文分号" },
	{ value: ";", label: "分号（英）", description: "英文分号" },
	{ value: " ", label: "空格", description: "空格分隔" },
] as const;

const DEFAULT_SEPARATORS = ALL_SEPARATORS.map((s) => s.value);

const PRESETS: Record<
	ChunkingPreset,
	{
		label: string;
		description: string;
		config: Omit<ChunkingConfigValue, "separators">;
	}
> = {
	default: {
		label: "默认",
		description: "适合大多数文档",
		config: { strategy: "character", chunkSize: 1000, chunkOverlap: 200 },
	},
	fine: {
		label: "精细",
		description: "更小的分块，适合精确检索",
		config: { strategy: "character", chunkSize: 500, chunkOverlap: 100 },
	},
	coarse: {
		label: "粗略",
		description: "更大的分块，保留更多上下文",
		config: { strategy: "character", chunkSize: 2000, chunkOverlap: 400 },
	},
	custom: {
		label: "自定义",
		description: "手动配置所有参数",
		config: { strategy: "character", chunkSize: 1000, chunkOverlap: 200 },
	},
};

const STRATEGY_OPTIONS = [
	{ value: "character" as const, label: "按字符", description: "按字符数分割" },
	{
		value: "token" as const,
		label: "按 Token",
		description: "按估算 Token 数分割",
	},
];

const CHUNK_SIZE_LIMITS = {
	character: { min: 100, max: 4000, step: 100 },
	token: { min: 50, max: 2000, step: 50 },
};

const OVERLAP_MAX_RATIO = 0.5;

function detectPreset(value: ChunkingConfigValue): ChunkingPreset {
	for (const [key, preset] of Object.entries(PRESETS)) {
		if (key === "custom") continue;
		const { config } = preset;
		if (
			config.strategy === value.strategy &&
			config.chunkSize === value.chunkSize &&
			config.chunkOverlap === value.chunkOverlap
		) {
			return key as ChunkingPreset;
		}
	}
	return "custom";
}

export const DEFAULT_CHUNKING_CONFIG: ChunkingConfigValue = {
	strategy: "character",
	chunkSize: 1000,
	chunkOverlap: 200,
	separators: [...DEFAULT_SEPARATORS],
};

export function ChunkingConfig({
	value,
	onChange,
	disabled = false,
	className,
}: ChunkingConfigProps) {
	const activePreset = useMemo(() => detectPreset(value), [value]);

	const sizeLimits = CHUNK_SIZE_LIMITS[value.strategy];
	const overlapMax = Math.floor(value.chunkSize * OVERLAP_MAX_RATIO);

	const handlePresetChange = useCallback(
		(preset: string) => {
			if (preset === "custom") return;
			const presetConfig = PRESETS[preset as ChunkingPreset];
			if (!presetConfig) return;
			onChange({
				...presetConfig.config,
				separators: [...DEFAULT_SEPARATORS],
			});
		},
		[onChange],
	);

	const handleStrategyChange = useCallback(
		(strategy: string) => {
			const limits = CHUNK_SIZE_LIMITS[strategy as ChunkingStrategy];
			const clampedSize = clamp(value.chunkSize, limits.min, limits.max);
			const clampedOverlap = clamp(
				value.chunkOverlap,
				0,
				Math.floor(clampedSize * OVERLAP_MAX_RATIO),
			);
			onChange({
				...value,
				strategy: strategy as ChunkingStrategy,
				chunkSize: clampedSize,
				chunkOverlap: clampedOverlap,
			});
		},
		[value, onChange],
	);

	const handleChunkSizeChange = useCallback(
		(size: number) => {
			const clamped = clamp(size, sizeLimits.min, sizeLimits.max);
			const maxOverlap = Math.floor(clamped * OVERLAP_MAX_RATIO);
			onChange({
				...value,
				chunkSize: clamped,
				chunkOverlap: Math.min(value.chunkOverlap, maxOverlap),
			});
		},
		[value, onChange, sizeLimits],
	);

	const handleChunkOverlapChange = useCallback(
		(overlap: number) => {
			onChange({
				...value,
				chunkOverlap: clamp(overlap, 0, overlapMax),
			});
		},
		[value, onChange, overlapMax],
	);

	const handleSeparatorToggle = useCallback(
		(separator: string, enabled: boolean) => {
			const next = enabled
				? [...value.separators, separator]
				: value.separators.filter((s) => s !== separator);
			onChange({ ...value, separators: next });
		},
		[value, onChange],
	);

	const handleResetSeparators = useCallback(() => {
		onChange({ ...value, separators: [...DEFAULT_SEPARATORS] });
	}, [value, onChange]);

	const allSeparatorsEnabled =
		value.separators.length === ALL_SEPARATORS.length;

	return (
		<div
			className={cn("space-y-6", className)}
			data-disabled={disabled || undefined}
		>
			<FieldSet disabled={disabled}>
				{/* 预设选择 */}
				<Field>
					<FieldTitle>预设方案</FieldTitle>
					<div className="flex flex-wrap gap-2">
						{Object.entries(PRESETS).map(([key, preset]) => (
							<button
								key={key}
								type="button"
								disabled={disabled}
								onClick={() => handlePresetChange(key)}
								className={cn(
									"rounded-lg border px-3 py-2 text-left text-sm transition-colors",
									"hover:border-primary/50 hover:bg-primary/5",
									"disabled:opacity-50 disabled:pointer-events-none",
									activePreset === key
										? "border-primary bg-primary/10 text-foreground"
										: "border-border bg-card text-muted-foreground",
									key === "custom" && "cursor-default opacity-60",
								)}
							>
								<div className="font-medium">{preset.label}</div>
								<div className="text-xs text-muted-foreground mt-0.5">
									{preset.description}
								</div>
							</button>
						))}
					</div>
				</Field>

				{/* 分块策略 */}
				<Field>
					<FieldLabel>分块策略</FieldLabel>
					<Select value={value.strategy} onValueChange={handleStrategyChange}>
						<SelectTrigger className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{STRATEGY_OPTIONS.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									<span>{opt.label}</span>
									<span className="text-muted-foreground ml-2 text-xs">
										{opt.description}
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<FieldDescription>
						{value.strategy === "character"
							? "按字符数量分割文本，适合大多数中英文混合文档"
							: "按估算的 Token 数量分割文本，更贴近模型实际处理长度"}
					</FieldDescription>
				</Field>

				{/* 分块大小 */}
				<FieldGroup>
					<Field>
						<div className="flex items-center justify-between">
							<FieldTitle>
								分块大小
								<Badge variant="secondary" className="ml-2 font-mono">
									{value.chunkSize}
									{value.strategy === "character" ? " 字符" : " Token"}
								</Badge>
							</FieldTitle>
							<Input
								type="number"
								value={value.chunkSize}
								onChange={(e) => handleChunkSizeChange(Number(e.target.value))}
								min={sizeLimits.min}
								max={sizeLimits.max}
								step={sizeLimits.step}
								className="w-24 text-right"
								disabled={disabled}
							/>
						</div>
						<Slider
							value={[value.chunkSize]}
							onValueChange={([v]) => handleChunkSizeChange(v)}
							min={sizeLimits.min}
							max={sizeLimits.max}
							step={sizeLimits.step}
							disabled={disabled}
						/>
						<FieldDescription>
							每个文本块的最大
							{value.strategy === "character" ? "字符" : "Token"}
							数。较小的值提高检索精度，较大的值保留更多上下文。
						</FieldDescription>
					</Field>

					{/* 重叠大小 */}
					<Field>
						<div className="flex items-center justify-between">
							<FieldTitle>
								重叠大小
								<Badge variant="secondary" className="ml-2 font-mono">
									{value.chunkOverlap}
									{value.strategy === "character" ? " 字符" : " Token"}
								</Badge>
							</FieldTitle>
							<Input
								type="number"
								value={value.chunkOverlap}
								onChange={(e) =>
									handleChunkOverlapChange(Number(e.target.value))
								}
								min={0}
								max={overlapMax}
								step={sizeLimits.step}
								className="w-24 text-right"
								disabled={disabled}
							/>
						</div>
						<Slider
							value={[value.chunkOverlap]}
							onValueChange={([v]) => handleChunkOverlapChange(v)}
							min={0}
							max={overlapMax}
							step={sizeLimits.step}
							disabled={disabled}
						/>
						<FieldDescription>
							相邻块之间的重叠
							{value.strategy === "character" ? "字符" : "Token"}
							数。适当的重叠可以避免在分块边界丢失语义。
						</FieldDescription>
					</Field>
				</FieldGroup>

				{/* 分隔符配置 */}
				<Field>
					<div className="flex items-center justify-between">
						<FieldTitle>
							<span>分隔符</span>
							<span className="text-xs font-normal text-muted-foreground ml-2">
								（{value.separators.length}/{ALL_SEPARATORS.length} 已启用）
							</span>
						</FieldTitle>
						{!allSeparatorsEnabled && (
							<Button
								type="button"
								variant="ghost"
								size="xs"
								onClick={handleResetSeparators}
								disabled={disabled}
								className="text-muted-foreground"
							>
								<RotateCcw className="w-3 h-3 mr-1" />
								重置
							</Button>
						)}
					</div>
					<FieldDescription>
						文本分块时按优先级尝试在这些分隔符处断开，保持语义完整性。
					</FieldDescription>
					<div className="grid grid-cols-2 gap-2 mt-2">
						{ALL_SEPARATORS.map((sep) => {
							const isEnabled = value.separators.includes(sep.value);
							return (
								<SeparatorToggle
									key={sep.value}
									label={sep.label}
									description={sep.description}
									enabled={isEnabled}
									disabled={disabled}
									onToggle={(checked) =>
										handleSeparatorToggle(sep.value, checked)
									}
								/>
							);
						})}
					</div>
				</Field>

				{/* 预估信息 */}
				<div className="rounded-lg border border-border bg-muted/30 p-4">
					<div className="flex items-start gap-2 text-sm">
						<Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
						<div className="text-muted-foreground space-y-1">
							<p>
								当前配置：每块最多{" "}
								<span className="font-medium text-foreground">
									{value.chunkSize}{" "}
									{value.strategy === "character" ? "字符" : "Token"}
								</span>
								，重叠{" "}
								<span className="font-medium text-foreground">
									{value.chunkOverlap}{" "}
									{value.strategy === "character" ? "字符" : "Token"}
								</span>
								，启用{" "}
								<span className="font-medium text-foreground">
									{value.separators.length}
								</span>{" "}
								个分隔符。
							</p>
							<p>
								重叠率：
								<span className="font-medium text-foreground">
									{value.chunkSize > 0
										? Math.round((value.chunkOverlap / value.chunkSize) * 100)
										: 0}
									%
								</span>
							</p>
						</div>
					</div>
				</div>
			</FieldSet>
		</div>
	);
}

function SeparatorToggle({
	label,
	description,
	enabled,
	disabled,
	onToggle,
}: {
	label: string;
	description: string;
	enabled: boolean;
	disabled: boolean;
	onToggle: (checked: boolean) => void;
}) {
	return (
		<div
			role="group"
			className={cn(
				"flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors cursor-pointer",
				"hover:bg-muted/50",
				enabled
					? "border-primary/30 bg-primary/5"
					: "border-border bg-card opacity-60",
				disabled && "pointer-events-none opacity-50",
			)}
			onClick={() => !disabled && onToggle(!enabled)}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onToggle(!enabled);
				}
			}}
			tabIndex={disabled ? -1 : 0}
		>
			<div className="flex items-center gap-2">
				<span className="font-medium">{label}</span>
				<span className="text-xs text-muted-foreground">{description}</span>
			</div>
			<Switch
				size="sm"
				checked={enabled}
				onCheckedChange={onToggle}
				disabled={disabled}
				tabIndex={-1}
			/>
		</div>
	);
}

function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value));
}
