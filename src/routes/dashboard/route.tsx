import { createFileRoute, Outlet } from "@tanstack/react-router";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export const Route = createFileRoute("/dashboard")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<DashboardLayout>
			<Outlet />
		</DashboardLayout>
	);
}
