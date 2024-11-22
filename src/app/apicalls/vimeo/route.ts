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

const createMedia = async (
    destinationPlatform: PlatformCredentials,
    mp4Url: string,
    videoId: string
) => {
    const credentials = destinationPlatform?.credentials;
    const url = 'https://v1.fastpix.io/on-demand';

    const config = destinationPlatform?.config || {};
    const playbackPolicy = config?.playbackPolicy?.length === 1 ? "public" : "private";
    const testmode = config?.testMode ? config.testMode : null;

    const requestBody = {
        metadata: {
            vimeoVideoId: videoId,
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

            return { success: false, message: "Failed to create media" }
        }
    } catch (error) {

        return { success: false, message: error?.message ?? "Failed t0 create media" }
    }
};

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const sourcePlatform = data?.sourcePlatform;
        const destinationPlatform = data?.destinationPlatform;

        if (!sourcePlatform || !destinationPlatform) {

            return new Response(
                JSON.stringify({ message: 'Source or destination platform not provided' }),
                { status: 400 }
            );
        }

        if (sourcePlatform.id === 'vimeo') {
            const videos = await fetchVimeoMedia(sourcePlatform);

            if (!videos || videos.length === 0) {
                return new Response(
                    JSON.stringify({ message: 'No videos found for the user' }),
                    { status: 404 }
                );
            }

            const createdMedia = [];

            for (const video of videos) {

                const mp4Asset = video?.download?.find((file) => file.quality === 'source');
                const videoId = video?.uri?.split('/')?.[2];
                const sourceDownloadLink = mp4Asset ? mp4Asset?.link : null;

                if (mp4Asset) {
                    const createdMediaEntry = await createMedia(
                        destinationPlatform,
                        sourceDownloadLink,
                        videoId
                    );

                    if (createdMediaEntry) {
                        createdMedia.push(createdMediaEntry);
                    }
                }
            }

            if (createdMedia.length > 0) {

                return new Response(
                    JSON.stringify({ success: true, createdMedia }),
                    {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    }
                );
            } else {

                return new Response(
                    JSON.stringify({ message: "No media created" }),
                    { status: 400, }
                );
            }
        } else {

            return new Response(
                JSON.stringify({ message: "No media created" }),
                { status: 400 }
            );
        }
    } catch (error) {

        return new Response(
            JSON.stringify({ message: error?.message ?? 'Internal server error' }),
            { status: 500 }
        );
    }
}
