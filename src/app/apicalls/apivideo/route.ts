import { NextRequest, NextResponse } from "next/server";

interface MetaData {
    environment: string;
    platformId: string;
}

interface LogoImage {
    key: null;
    props: Record<string, string>;
    _owner: string;
    _store: Record<string, string>;
}

interface Credentials {
    publicKey: string;
    secretKey: string;
    logo: LogoImage;
    additionalMetadata: MetaData;
}

interface VideoConfig {
    encodingTier: string;
    playbackPolicy: Array<string>;
}

interface PlatformCredentials {
    id: string;
    name: string;
    credentials: Credentials;
    config?: VideoConfig;
}

// Fetch media from API Video
const fetchApiVideoMedia = async (sourcePlatform: PlatformCredentials) => {
    const credentials = sourcePlatform?.credentials;
    const endpoint = sourcePlatform?.credentials?.additionalMetadata?.environment === 'sandbox' ? "https://sandbox.api.video/videos" : "https://ws.api.video"

    const videos: any[] = [];
    let currentPage = 1;
    let totalPages = 1;

    try {
        do {
            const response = await fetch(`${endpoint}?currentPage=${currentPage}&pageSize=25`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${credentials?.secretKey ?? ""}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch videos from API Video");
            }

            const result = await response.json();
            videos.push(...result.data);
            totalPages = result.pagination.pagesTotal;
            currentPage++;
        } while (currentPage <= totalPages);

        return { success: true, videos };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
};

// Create media in Fastpix
const createMediaInFastpix = async (
    destinationPlatform: PlatformCredentials,
    videoUrl: string,
    videoId: string
) => {
    const credentials = destinationPlatform?.credentials;
    const config = destinationPlatform?.config;
    const playbackPolicy = config?.playbackPolicy?.length === 1 ? "public" : "private";
    const testMode = config?.testMode === "1";

    const requestBody = {
        metadata: {
            APIvideoId: videoId,
        },
        accessPolicy: playbackPolicy,
        inputs: [
            {
                type: "video",
                url: videoUrl,
                ...(testMode ? { startTime: 0, endTime: 10 } : {}),
            },
        ],
        mp4Support: "capped_4k",
    };

    try {
        const response = await fetch("https://v1.fastpix.io/on-demand", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Basic ${Buffer.from(
                    `${credentials?.publicKey ?? ""}:${credentials?.secretKey ?? ""}`
                ).toString("base64")}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error("Failed to create media in Fastpix");
        }

        return { success: true, response: await response.json() };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
};

// API Video Migration Endpoint
export async function POST(request: NextRequest) {
    try {
        const { sourcePlatform, destinationPlatform } = await request.json();

        if (!sourcePlatform || !destinationPlatform) {
            return NextResponse.json(
                { error: "Invalid request. Missing platform credentials." },
                { status: 400 }
            );
        }

        const fetchResult = await fetchApiVideoMedia(sourcePlatform);
        if (!fetchResult.success) {
            return NextResponse.json(
                { error: fetchResult.message },
                { status: 400 }
            );
        }

        const videos = fetchResult.videos;
        const createdMedia = [];
        const failedMedia = [];

        for (const video of videos) {
            const mp4Url = video?.assets?.mp4;
            if (mp4Url !== "none") {
                const videoId = video.videoId;
                const result = await createMediaInFastpix(destinationPlatform, mp4Url, videoId);

                if (result.success) {
                    createdMedia.push(result.response);
                } else {
                    failedMedia.push({ videoId, error: result.message });
                }
            }
        }

        if (createdMedia.length > 0) {
            return NextResponse.json(
                { success: true, createdMedia, failedMedia },
                { status: 200 }
            );
        } else {
            return NextResponse.json(
                { error: "No media were created" },
                { status: 400 }
            );
        }
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message ?? "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
