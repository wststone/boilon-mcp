import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { mcpServiceConfig } from "@/db/schema";
import type { McpService } from "../types";
import { serviceRegistry } from "./registry";

const ALL_SERVICES: Exclude<McpService, "unified">[] = [
	"rag",
	"weather",
	"music",
	"news",
];

/**
 * 查询组织已启用的服务列表
 * 无配置记录的服务默认启用
 */
async function getEnabledServices(
	organizationId?: string,
): Promise<Exclude<McpService, "unified">[]> {
	if (!organizationId) {
		// 无组织信息时默认全部启用
		return ALL_SERVICES;
	}

	const configs = await db
		.select({
			service: mcpServiceConfig.service,
			enabled: mcpServiceConfig.enabled,
		})
		.from(mcpServiceConfig)
		.where(eq(mcpServiceConfig.organizationId, organizationId));

	const configMap = new Map(configs.map((c) => [c.service, c.enabled]));

	return ALL_SERVICES.filter((svc) => configMap.get(svc) ?? true);
}

/**
 * 创建统一 MCP 服务器，聚合所有已启用服务的工具
 */
export async function createUnifiedServer(
	organizationId: string,
	userId: string,
): Promise<McpServer> {
	const enabledServices = await getEnabledServices(organizationId || undefined);

	const server = new McpServer({
		name: "boilon-mcp",
		version: "1.0.0",
	});

	for (const service of enabledServices) {
		const registerFn = serviceRegistry[service];
		registerFn(server, userId);
	}

	return server;
}
