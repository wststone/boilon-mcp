export type McpService = "rag" | "weather" | "music" | "news" | "unified";

export interface McpToolResult {
	content: Array<{
		type: "text" | "image" | "resource";
		text?: string;
		data?: string;
		mimeType?: string;
	}>;
	isError?: boolean;
}

export interface McpResource {
	uri: string;
	name: string;
	description?: string;
	mimeType?: string;
}

export interface McpResourceTemplate {
	uriTemplate: string;
	name: string;
	description?: string;
	mimeType?: string;
}

// RAG Service Types
export interface RagDocument {
	id: number;
	title: string;
	content: string;
	metadata?: Record<string, unknown>;
	similarity?: number;
}

export interface RagSearchResult {
	documents: RagDocument[];
	query: string;
	totalResults: number;
}

// Weather Service Types (高德地图 Amap API)
export interface WeatherData {
	province: string;
	city: string;
	adcode: string;
	weather: string;
	temperature: number;
	winddirection: string;
	windpower: string;
	humidity: number;
	reporttime: string;
}

export interface WeatherForecast {
	province: string;
	city: string;
	adcode: string;
	reporttime: string;
	casts: Array<{
		date: string;
		week: string;
		dayweather: string;
		nightweather: string;
		daytemp: number;
		nighttemp: number;
		daywind: string;
		nightwind: string;
		daypower: string;
		nightpower: string;
	}>;
}

// Music Service Types
export interface MusicTrack {
	id: string;
	name: string;
	artist: string;
	album: string;
	duration: number;
	previewUrl?: string;
	popularity: number;
	genres?: string[];
}

export interface MusicArtist {
	id: string;
	name: string;
	genres: string[];
	popularity: number;
	followers: number;
	imageUrl?: string;
	topTracks?: MusicTrack[];
}

export interface MusicRecommendation {
	tracks: MusicTrack[];
	seedArtists?: string[];
	seedGenres?: string[];
	seedTracks?: string[];
}

export interface MusicGenre {
	id: string;
	name: string;
	description?: string;
	parentGenre?: string;
}

// News Service Types (Bocha AI)
export interface NewsArticle {
	id: string;
	title: string;
	url: string;
	source: string;
	sourceIcon?: string;
	snippet: string;
	summary?: string;
	publishedAt?: string;
}

export interface NewsSearchResult {
	query: string;
	articles: NewsArticle[];
	totalResults: number;
	topic?: string;
	category?: string;
}
