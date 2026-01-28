import { MutationCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const mutationCache = new MutationCache({
	onSuccess: (_data, _variables, _context, mutation) => {
		// 根据 mutationKey[0] 自动 invalidate 对应查询
		const key = mutation.options.mutationKey?.[0];
		if (key) {
			queryClient.invalidateQueries({ queryKey: [key] });
		}

		// 显示成功提示
		const meta = mutation.options.meta as
			| { success?: { message: string } }
			| undefined;
		if (meta?.success?.message) {
			toast.success(meta.success.message);
		}
	},
	onError: (error, _variables, _context, mutation) => {
		// 显示错误提示
		const meta = mutation.options.meta as
			| { error?: { message: string } }
			| undefined;
		const message =
			meta?.error?.message ||
			(error instanceof Error ? error.message : "操作失败");
		toast.error(message);
	},
});

const queryClient = new QueryClient({
	mutationCache,
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60, // 1 minute
			refetchOnWindowFocus: false,
		},
	},
});

export function getContext() {
	return {
		queryClient,
	};
}
