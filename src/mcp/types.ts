export type McpService = "rag" | "weather" | "music";

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

// Weather Service Types
export interface WeatherData {
	location: string;
	temperature: number;
	feelsLike: number;
	humidity: number;
	description: string;
	windSpeed: number;
	windDirection: string;
	pressure: number;
	visibility: number;
	uvIndex?: number;
	sunrise?: string;
	sunset?: string;
}

export interface WeatherForecast {
	location: string;
	forecasts: Array<{
		date: string;
		high: number;
		low: number;
		description: string;
		precipitation: number;
		humidity: number;
		windSpeed: number;
	}>;
}

export interface WeatherAlert {
	id: string;
	event: string;
	headline: string;
	description: string;
	severity: "minor" | "moderate" | "severe" | "extreme";
	start: string;
	end: string;
	areas: string[];
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
