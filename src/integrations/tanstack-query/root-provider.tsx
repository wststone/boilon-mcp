import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
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
