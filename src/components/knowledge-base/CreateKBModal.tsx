import { Database, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CreateKBModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: { name: string; description: string }) => Promise<void>;
}

export function CreateKBModal({ isOpen, onClose, onSubmit }: CreateKBModalProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	if (!isOpen) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!name.trim()) {
			setError("请输入知识库名称");
			return;
		}

		setIsLoading(true);
		try {
			await onSubmit({ name: name.trim(), description: description.trim() });
			setName("");
			setDescription("");
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "创建失败");
		} finally {
			setIsLoading(false);
		}
	};

	const handleClose = () => {
		setName("");
		setDescription("");
		setError("");
		onClose();
	};

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
			<div className="bg-card border border-border rounded-2xl w-full max-w-md">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-border">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
							<Database className="w-5 h-5 text-cyan-600" />
						</div>
						<h2 className="text-lg font-semibold text-foreground">创建知识库</h2>
					</div>
					<button
						onClick={handleClose}
						className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Content */}
				<form onSubmit={handleSubmit} className="p-6 space-y-4">
					{error && (
						<div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
							{error}
						</div>
					)}

					<div className="space-y-2">
						<Label htmlFor="name" className="text-foreground/70">
							知识库名称 <span className="text-red-400">*</span>
						</Label>
						<Input
							id="name"
							placeholder="例如：产品文档"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="bg-muted border-border text-foreground placeholder:text-muted-foreground/60"
							disabled={isLoading}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description" className="text-foreground/70">
							描述（可选）
						</Label>
						<Textarea
							id="description"
							placeholder="简要描述这个知识库的用途..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="bg-muted border-border text-foreground placeholder:text-muted-foreground/60 min-h-[80px]"
							disabled={isLoading}
						/>
					</div>

					{/* Actions */}
					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="ghost"
							onClick={handleClose}
							className="flex-1 text-muted-foreground hover:text-foreground hover:bg-muted"
							disabled={isLoading}
						>
							取消
						</Button>
						<Button
							type="submit"
							className="flex-1 bg-cyan-500 hover:bg-cyan-600"
							disabled={isLoading}
						>
							{isLoading ? "创建中..." : "创建"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
