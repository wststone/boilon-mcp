import { createFileRoute } from "@tanstack/react-router";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { asyncTasks } from "@/db/asyncTask";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/api/tasks/$taskId")({
	server: {
		handlers: {
			// 获取任务状态
			GET: async ({ request, params }) => {
				try {
					const session = await auth.api.getSession({ headers: request.headers });
					if (!session?.user) {
						return new Response(JSON.stringify({ error: "未授权" }), {
							status: 401,
							headers: { "Content-Type": "application/json" },
						});
					}

					const userId = session.user.id;
					const { taskId } = params;

					const [task] = await db
						.select()
						.from(asyncTasks)
						.where(
							and(eq(asyncTasks.id, taskId), eq(asyncTasks.userId, userId))
						)
						.limit(1);

					if (!task) {
						return new Response(JSON.stringify({ error: "任务不存在" }), {
							status: 404,
							headers: { "Content-Type": "application/json" },
						});
					}

					return new Response(
						JSON.stringify({
							data: {
								id: task.id,
								type: task.type,
								status: task.status,
								error: (task.error as { message?: string })?.message,
								duration: task.duration,
								createdAt: task.createdAt,
								updatedAt: task.updatedAt,
							},
						}),
						{
							status: 200,
							headers: { "Content-Type": "application/json" },
						}
					);
				} catch (error) {
					console.error("获取任务状态失败:", error);
					return new Response(
						JSON.stringify({ error: "获取任务状态失败" }),
						{
							status: 500,
							headers: { "Content-Type": "application/json" },
						}
					);
				}
			},
		},
	},
});
