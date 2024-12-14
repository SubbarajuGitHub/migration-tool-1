import { NextRequest, NextResponse } from "next/server";
import processVideosForPlatform from "../fastpix/route";

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

        const result = await processVideosForPlatform(destinationPlatform, videos, "apivideo");
        const createdMedia = result.createdMedia
        const failedMedia = result.failedMedia

        if (createdMedia.length > 0 || failedMedia.length > 0) {
            return NextResponse.json(
                { success: true, createdMedia, failedMedia },
                { status: 200 }
            );
        } else {
            const errorMsg = videos.length === 0 ? "No Vidoes found in API Video" : "Failed to create Media"
            return NextResponse.json(
                { error:  errorMsg},
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
