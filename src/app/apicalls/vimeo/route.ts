import processVideosForPlatform from "../fastpix/route";
import { NextResponse } from "next/server";

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

const fetchVimeoMedia = async (sourcePlatform: PlatformCredentials) => {
    const token = sourcePlatform?.credentials?.secretKey;

    try {
        const response = await fetch('https://api.vimeo.com/me/videos', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const data = await response.json();
            return data?.data || [];
        } else {

            return { success: false, message: "Failed t0 get media" }
        }
    } catch (error) {

        return { success: false, message: error?.message ?? "Failed to get media" }
    }
};

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const sourcePlatform = data?.sourcePlatform;
        const destinationPlatform = data?.destinationPlatform;

        if (!sourcePlatform || !destinationPlatform) {

            return NextResponse.json(
                JSON.stringify({ message: 'Source or destination platform not provided' }),
                { status: 400 }
            );
        }

        if (sourcePlatform.id === 'vimeo') {
            const videos = await fetchVimeoMedia(sourcePlatform);

            if (!videos || videos.length === 0) {
                return NextResponse.json(
                    JSON.stringify({ message: 'No videos found for the user' }),
                    { status: 404 }
                );
            }

            const result = await processVideosForPlatform(destinationPlatform, videos, "vimeo")

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
                    { error: errorMsg },
                    { status: 400 }
                );
            }
        } else {

            return NextResponse.json(
                JSON.stringify({ message: "No media created" }),
                { status: 400 }
            );
        }
    } catch (error) {

        return NextResponse.json(
            JSON.stringify({ message: error?.message ?? 'Internal server error' }),
            { status: 500 }
        );
    }
}
