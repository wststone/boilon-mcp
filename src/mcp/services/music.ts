import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { MusicArtist, MusicGenre, MusicTrack } from "../types";

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_BASE_URL = "https://ws.audioscrobbler.com/2.0/";

/**
 * Fetch data from Last.fm API
 */
async function fetchLastFm(
	method: string,
	params: Record<string, string>,
): Promise<unknown> {
	const url = new URL(LASTFM_BASE_URL);
	url.searchParams.set("method", method);
	url.searchParams.set("api_key", LASTFM_API_KEY || "demo");
	url.searchParams.set("format", "json");

	for (const [key, value] of Object.entries(params)) {
		url.searchParams.set(key, value);
	}

	const response = await fetch(url.toString());

	if (!response.ok) {
		throw new Error(`Last.fm API error: ${response.statusText}`);
	}

	return response.json();
}

/**
 * Mock music data for demo
 */
const mockArtists: MusicArtist[] = [
	{
		id: "1",
		name: "The Beatles",
		genres: ["rock", "pop", "british invasion"],
		popularity: 95,
		followers: 25000000,
		topTracks: [
			{
				id: "t1",
				name: "Hey Jude",
				artist: "The Beatles",
				album: "Past Masters",
				duration: 431,
				popularity: 92,
			},
			{
				id: "t2",
				name: "Let It Be",
				artist: "The Beatles",
				album: "Let It Be",
				duration: 243,
				popularity: 90,
			},
		],
	},
	{
		id: "2",
		name: "Queen",
		genres: ["rock", "glam rock", "arena rock"],
		popularity: 93,
		followers: 22000000,
		topTracks: [
			{
				id: "t3",
				name: "Bohemian Rhapsody",
				artist: "Queen",
				album: "A Night at the Opera",
				duration: 354,
				popularity: 95,
			},
			{
				id: "t4",
				name: "We Will Rock You",
				artist: "Queen",
				album: "News of the World",
				duration: 122,
				popularity: 91,
			},
		],
	},
	{
		id: "3",
		name: "Taylor Swift",
		genres: ["pop", "country pop", "synth-pop"],
		popularity: 98,
		followers: 80000000,
		topTracks: [
			{
				id: "t5",
				name: "Anti-Hero",
				artist: "Taylor Swift",
				album: "Midnights",
				duration: 200,
				popularity: 96,
			},
			{
				id: "t6",
				name: "Shake It Off",
				artist: "Taylor Swift",
				album: "1989",
				duration: 219,
				popularity: 93,
			},
		],
	},
	{
		id: "4",
		name: "Daft Punk",
		genres: ["electronic", "house", "french house"],
		popularity: 85,
		followers: 15000000,
		topTracks: [
			{
				id: "t7",
				name: "Get Lucky",
				artist: "Daft Punk",
				album: "Random Access Memories",
				duration: 369,
				popularity: 90,
			},
			{
				id: "t8",
				name: "Around the World",
				artist: "Daft Punk",
				album: "Homework",
				duration: 428,
				popularity: 85,
			},
		],
	},
	{
		id: "5",
		name: "Kendrick Lamar",
		genres: ["hip-hop", "conscious hip-hop", "west coast rap"],
		popularity: 92,
		followers: 30000000,
		topTracks: [
			{
				id: "t9",
				name: "HUMBLE.",
				artist: "Kendrick Lamar",
				album: "DAMN.",
				duration: 177,
				popularity: 94,
			},
			{
				id: "t10",
				name: "Swimming Pools",
				artist: "Kendrick Lamar",
				album: "good kid, m.A.A.d city",
				duration: 313,
				popularity: 88,
			},
		],
	},
];

const mockGenres: MusicGenre[] = [
	{ id: "rock", name: "Rock", description: "Guitar-driven popular music" },
	{ id: "pop", name: "Pop", description: "Popular mainstream music" },
	{
		id: "hip-hop",
		name: "Hip-Hop",
		description: "Rhythmic music with rap vocals",
	},
	{
		id: "electronic",
		name: "Electronic",
		description: "Music produced with electronic instruments",
	},
	{
		id: "jazz",
		name: "Jazz",
		description: "Improvisational music with complex harmonies",
	},
	{
		id: "classical",
		name: "Classical",
		description: "Western art music tradition",
	},
	{ id: "r-n-b", name: "R&B", description: "Rhythm and blues music" },
	{
		id: "country",
		name: "Country",
		description: "American folk and rural music",
	},
	{
		id: "metal",
		name: "Metal",
		description: "Heavy, aggressive rock music",
		parentGenre: "rock",
	},
	{
		id: "indie",
		name: "Indie",
		description: "Independent alternative music",
		parentGenre: "rock",
	},
	{
		id: "house",
		name: "House",
		description: "Electronic dance music",
		parentGenre: "electronic",
	},
	{
		id: "techno",
		name: "Techno",
		description: "Electronic dance music from Detroit",
		parentGenre: "electronic",
	},
];

/**
 * Search mock data
 */
function searchMockTracks(query: string, limit: number): MusicTrack[] {
	const results: MusicTrack[] = [];
	const queryLower = query.toLowerCase();

	for (const artist of mockArtists) {
		if (
			artist.name.toLowerCase().includes(queryLower) ||
			artist.genres.some((g) => g.includes(queryLower))
		) {
			if (artist.topTracks) {
				results.push(...artist.topTracks);
			}
		} else if (artist.topTracks) {
			for (const track of artist.topTracks) {
				if (
					track.name.toLowerCase().includes(queryLower) ||
					track.album.toLowerCase().includes(queryLower)
				) {
					results.push(track);
				}
			}
		}
	}

	return results.slice(0, limit);
}

function findMockArtist(query: string): MusicArtist | undefined {
	const queryLower = query.toLowerCase();
	return mockArtists.find(
		(a) =>
			a.name.toLowerCase() === queryLower ||
			a.name.toLowerCase().includes(queryLower),
	);
}

function getMockRecommendations(
	seedArtists?: string[],
	seedGenres?: string[],
	limit = 10,
): MusicTrack[] {
	const tracks: MusicTrack[] = [];

	for (const artist of mockArtists) {
		const matchesArtist = seedArtists?.some(
			(s) =>
				artist.name.toLowerCase().includes(s.toLowerCase()) || artist.id === s,
		);
		const matchesGenre = seedGenres?.some((g) =>
			artist.genres.some((ag) => ag.toLowerCase().includes(g.toLowerCase())),
		);

		if (matchesArtist || matchesGenre || (!seedArtists && !seedGenres)) {
			if (artist.topTracks) {
				tracks.push(...artist.topTracks);
			}
		}
	}

	// Shuffle and return
	return tracks.sort(() => Math.random() - 0.5).slice(0, limit);
}

// ============================================
// Exported data functions (used by server functions and MCP tools)
// ============================================

type SearchTracksResult = {
	query: string;
	tracks: MusicTrack[];
	count: number;
	note?: string;
};

type GetArtistResult = {
	artist?: MusicArtist;
	error?: string;
	query?: string;
	note?: string;
};

type RecommendationsResult = {
	recommendations: MusicTrack[];
	seedArtists?: string[];
	seedGenres?: string[];
	count: number;
	note?: string;
};

type GenresResult = {
	genres: MusicGenre[];
	count: number;
	filter?: string;
};

type TopChartsResult = {
	charts: {
		country: string;
		tracks: MusicTrack[];
		count: number;
	};
	note?: string;
};

/**
 * 搜索歌曲
 */
export async function searchTracksData(
	query: string,
	limit = 10,
): Promise<SearchTracksResult> {
	const useRealApi = !!LASTFM_API_KEY;
	let tracks: MusicTrack[] = [];
	let note: string | undefined;

	if (useRealApi) {
		try {
			const data = (await fetchLastFm("track.search", {
				track: query,
				limit: String(limit),
			})) as {
				results: {
					trackmatches: {
						track: Array<{
							name: string;
							artist: string;
							listeners: string;
							mbid: string;
						}>;
					};
				};
			};

			tracks = data.results.trackmatches.track.map((t, i) => ({
				id: t.mbid || `track-${i}`,
				name: t.name,
				artist: t.artist,
				album: "Unknown",
				duration: 0,
				popularity: Math.min(100, Math.floor(Number(t.listeners) / 10000)),
			}));
		} catch {
			tracks = searchMockTracks(query, limit);
			note = "Using mock data due to API error";
		}
	} else {
		tracks = searchMockTracks(query, limit);
		note = "Demo mode - set LASTFM_API_KEY for real data";
	}

	return { query, tracks, count: tracks.length, ...(note && { note }) };
}

/**
 * 获取歌手信息
 */
export async function getArtistData(name: string): Promise<GetArtistResult> {
	const useRealApi = !!LASTFM_API_KEY;
	let artist: MusicArtist | undefined;
	let note: string | undefined;

	if (useRealApi) {
		try {
			const data = (await fetchLastFm("artist.getinfo", {
				artist: name,
			})) as {
				artist: {
					name: string;
					mbid: string;
					stats: { listeners: string; playcount: string };
					tags: { tag: Array<{ name: string }> };
					bio: { summary: string };
				};
			};

			const topTracksData = (await fetchLastFm("artist.gettoptracks", {
				artist: name,
				limit: "5",
			})) as {
				toptracks: {
					track: Array<{
						name: string;
						mbid: string;
						duration: string;
						listeners: string;
					}>;
				};
			};

			artist = {
				id: data.artist.mbid || name,
				name: data.artist.name,
				genres: data.artist.tags.tag.map((t) => t.name),
				popularity: Math.min(
					100,
					Math.floor(Number(data.artist.stats.listeners) / 100000),
				),
				followers: Number(data.artist.stats.listeners),
				topTracks: topTracksData.toptracks.track.map((t, i) => ({
					id: t.mbid || `track-${i}`,
					name: t.name,
					artist: name,
					album: "Unknown",
					duration: Number(t.duration),
					popularity: Math.min(
						100,
						Math.floor(Number(t.listeners) / 10000),
					),
				})),
			};
		} catch {
			artist = findMockArtist(name);
			note = "Using mock data due to API error";
		}
	} else {
		artist = findMockArtist(name);
		note = "Demo mode - set LASTFM_API_KEY for real data";
	}

	if (!artist) {
		return { error: "Artist not found", query: name };
	}

	return { artist, ...(note && { note }) };
}

/**
 * 获取音乐推荐
 */
export async function getRecommendationsData(
	seedArtists?: string[],
	seedGenres?: string[],
	limit = 10,
): Promise<RecommendationsResult> {
	const useRealApi = !!LASTFM_API_KEY;
	let tracks: MusicTrack[];
	let note: string | undefined;

	if (useRealApi && seedArtists && seedArtists.length > 0) {
		try {
			// Use Last.fm's similar artists and their top tracks
			const similarData = (await fetchLastFm("artist.getsimilar", {
				artist: seedArtists[0],
				limit: "5",
			})) as {
				similarartists: { artist: Array<{ name: string }> };
			};

			const allTracks: MusicTrack[] = [];

			for (const similar of similarData.similarartists.artist) {
				const topTracks = (await fetchLastFm("artist.gettoptracks", {
					artist: similar.name,
					limit: "3",
				})) as {
					toptracks: {
						track: Array<{
							name: string;
							mbid: string;
							duration: string;
							listeners: string;
						}>;
					};
				};

				for (const t of topTracks.toptracks.track) {
					allTracks.push({
						id: t.mbid || `track-${allTracks.length}`,
						name: t.name,
						artist: similar.name,
						album: "Unknown",
						duration: Number(t.duration),
						popularity: Math.min(
							100,
							Math.floor(Number(t.listeners) / 10000),
						),
					});
				}
			}

			tracks = allTracks.slice(0, limit);
		} catch {
			tracks = getMockRecommendations(seedArtists, seedGenres, limit);
			note = "Using mock data due to API error";
		}
	} else {
		tracks = getMockRecommendations(seedArtists, seedGenres, limit);
		note = useRealApi
			? "Provide seedArtists for real recommendations"
			: "Demo mode - set LASTFM_API_KEY for real data";
	}

	return {
		recommendations: tracks,
		seedArtists,
		seedGenres,
		count: tracks.length,
		...(note && { note }),
	};
}

/**
 * 获取曲风分类
 */
export function getGenresData(parentGenre?: string): GenresResult {
	let genres = mockGenres;

	if (parentGenre) {
		genres = mockGenres.filter(
			(g) =>
				g.parentGenre?.toLowerCase() === parentGenre.toLowerCase() ||
				g.id === parentGenre.toLowerCase(),
		);
	}

	return {
		genres,
		count: genres.length,
		...(parentGenre && { filter: parentGenre }),
	};
}

/**
 * 获取热门排行
 */
export async function getTopChartsData(
	country = "global",
	limit = 10,
): Promise<TopChartsResult> {
	const useRealApi = !!LASTFM_API_KEY;
	let tracks: MusicTrack[];
	let note: string | undefined;

	if (useRealApi) {
		try {
			const data = (await fetchLastFm("chart.gettoptracks", {
				limit: String(limit),
			})) as {
				tracks: {
					track: Array<{
						name: string;
						mbid: string;
						duration: string;
						listeners: string;
						artist: { name: string };
					}>;
				};
			};

			tracks = data.tracks.track.map((t, i) => ({
				id: t.mbid || `chart-${i}`,
				name: t.name,
				artist: t.artist.name,
				album: "Unknown",
				duration: Number(t.duration),
				popularity: 100 - i * 2, // Rank-based popularity
			}));
		} catch {
			tracks = mockArtists
				.flatMap((a) => a.topTracks || [])
				.sort((a, b) => b.popularity - a.popularity)
				.slice(0, limit);
			note = "Using mock data due to API error";
		}
	} else {
		tracks = mockArtists
			.flatMap((a) => a.topTracks || [])
			.sort((a, b) => b.popularity - a.popularity)
			.slice(0, limit);
		note = "Demo mode - set LASTFM_API_KEY for real data";
	}

	return {
		charts: { country, tracks, count: tracks.length },
		...(note && { note }),
	};
}

// ============================================
// MCP Server
// ============================================

/**
 * Creates and configures the Music MCP server
 */
export function createMusicServer(_organizationId: string, _userId: string): McpServer {
	const server = new McpServer({
		name: "boilon-music",
		version: "1.0.0",
	});

	// Tool: Search tracks
	server.tool(
		"search_tracks",
		"Search for music tracks by name, artist, or genre",
		{
			query: z.string().describe("Search query (track name, artist, or genre)"),
			limit: z
				.number()
				.optional()
				.default(10)
				.describe("Maximum number of results"),
		},
		async ({
			query,
			limit,
		}): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
			const result = await searchTracksData(query, limit);
			return {
				content: [{ type: "text", text: JSON.stringify(result) }],
			};
		},
	);

	// Tool: Get artist info
	server.tool(
		"get_artist",
		"Get detailed information about a music artist",
		{
			name: z.string().describe("Artist name"),
		},
		async ({
			name,
		}): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
			const result = await getArtistData(name);
			return {
				content: [{ type: "text", text: JSON.stringify(result) }],
			};
		},
	);

	// Tool: Get recommendations
	server.tool(
		"get_recommendations",
		"Get music recommendations based on artists or genres",
		{
			seedArtists: z
				.array(z.string())
				.optional()
				.describe("Artist names to base recommendations on"),
			seedGenres: z
				.array(z.string())
				.optional()
				.describe("Genres to base recommendations on"),
			limit: z
				.number()
				.optional()
				.default(10)
				.describe("Number of recommendations"),
		},
		async ({
			seedArtists,
			seedGenres,
			limit,
		}): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
			const result = await getRecommendationsData(
				seedArtists,
				seedGenres,
				limit,
			);
			return {
				content: [{ type: "text", text: JSON.stringify(result) }],
			};
		},
	);

	// Tool: Get genres
	server.tool(
		"get_genres",
		"Get list of available music genres",
		{
			parentGenre: z
				.string()
				.optional()
				.describe("Filter by parent genre (e.g., 'rock' for rock subgenres)"),
		},
		async ({
			parentGenre,
		}): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
			const result = getGenresData(parentGenre);
			return {
				content: [{ type: "text", text: JSON.stringify(result) }],
			};
		},
	);

	// Tool: Get top charts
	server.tool(
		"get_top_charts",
		"Get current top music charts",
		{
			country: z
				.string()
				.optional()
				.default("global")
				.describe("Country code (e.g., 'us', 'uk', 'global')"),
			limit: z.number().optional().default(10).describe("Number of tracks"),
		},
		async ({
			country,
			limit,
		}): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
			const result = await getTopChartsData(country, limit);
			return {
				content: [{ type: "text", text: JSON.stringify(result) }],
			};
		},
	);

	return server;
}
