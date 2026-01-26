import { Skeleton } from "@/components/ui/skeleton";

export function LoginSkeleton() {
	return (
		<div className="flex flex-col items-center justify-center text-center w-full">
			<div className="flex flex-col gap-2 max-w-sm w-full space-y-4">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</div>
		</div>
	);
}
