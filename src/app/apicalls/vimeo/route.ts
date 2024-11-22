import { NextRequest, NextResponse } from 'next/server';

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

    if (!token) {

        throw new Error("Missing Vimeo token in credentials");
    }

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

            throw new Error("Vimeo API error");
        }
    } catch (error) {

        throw new Error("Vimeo API error");
    }
};

const createMedia = async (
    destinationPlatform: PlatformCredentials,
    mp4Url: string,
    videoId: string
) => {
    const credentials = destinationPlatform?.credentials;
    const url = 'https://v1.fastpix.io/on-demand';

    if (!credentials?.publicKey || !credentials?.secretKey) {
        throw new Error("Missing Fastpix credentials");
    }

    const config = destinationPlatform?.config || {};
    const playbackPolicy = config?.playbackPolicy?.length === 1 ? "public" : "private";
    const testmode = config?.testMode ? config.testMode : null;

    const requestBody = {
        metadata: {
            APIvideoId: videoId,
        },
        accessPolicy: playbackPolicy,
        inputs: [
            {
                type: 'video',
                url: mp4Url,
                ...(testmode === "1" ? { startTime: 0, endTime: 10 } : {})
            },
        ],
        mp4Support: 'capped_4k',
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Basic ${Buffer.from(
                    `${credentials.publicKey}:${credentials.secretKey}`
                ).toString('base64')}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (response.ok) {

            const result = await response.json();
            return result;
        } else {

            throw new Error("Failed to create media");
        }
    } catch (error) {

        throw new Error("Failed to create media");
    }
};

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const sourcePlatform = data?.sourcePlatform;
        const destinationPlatform = data?.destinationPlatform;

        if (!sourcePlatform || !destinationPlatform) {
            return NextResponse.json(
                { message: 'Source or destination platform not provided' },
                { status: 400 }
            );
        }

        if (sourcePlatform.id === 'vimeo') {
            const videos = await fetchVimeoMedia(sourcePlatform);

            if (!videos || videos.length === 0) {
                return NextResponse.json(
                    { message: 'No videos found for the user' },
                    { status: 404 }
                );
            }

            const createdMedia = [];

            for (const video of videos) {
                const mp4Asset = video?.download?.find((file: any) => file.type === 'mp4');

                if (mp4Asset) {
                    const createdMediaEntry = await createMedia(
                        destinationPlatform,
                        mp4Asset.link,
                        video.uri.split('/').pop()
                    );

                    if (createdMediaEntry) {
                        createdMedia.push(createdMediaEntry);
                    }
                }
            }

            if (createdMedia.length > 0) {
                return NextResponse.json(
                    { success: true, createdMedia },
                    { status: 200 }
                );
            } else {
                return NextResponse.json(
                    { message: 'No media could be created' },
                    { status: 400 }
                );
            }
        } else {
            return NextResponse.json(
                { message: 'Invalid source platform' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

           
         
