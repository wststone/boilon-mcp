import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useSession } from "@/lib/auth-client";
import { LoginLink } from "./-components/login-link";
import { LoginSkeleton } from "./-components/login-skeleton";

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
});

function RouteComponent() {
	const { data: session, isPending } = useSession();

	return (
		<DashboardLayout>
			{isPending ? <LoginSkeleton /> : session ? <Outlet /> : <LoginLink />}
		</DashboardLayout>
	);
}
