import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpService } from "../types";
import { registerMusicTools } from "./music";
import { registerNewsTools } from "./news";
import { registerRagTools } from "./rag";
import { registerWeatherTools } from "./weather";

type RegisterToolsFn = (server: McpServer, userId: string) => void;

/**
 * 各服务的工具注册函数映射
 * 统一端点通过此注册表按需加载已启用服务的工具
 */
export const serviceRegistry: Record<Exclude<McpService, "unified">, RegisterToolsFn> = {
	rag: registerRagTools,
	weather: (server, _userId) => registerWeatherTools(server),
	music: (server, _userId) => registerMusicTools(server),
	news: (server, _userId) => registerNewsTools(server),
};
