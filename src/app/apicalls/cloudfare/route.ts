interface MetaData {
    environment: string;
    platformId: string;
}

interface LogoImage {
    key: null;
    props: Record<string, string>;
    _onwer: string;
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

// Fetch media from the new platform
const fetchNewPlatformMedia = async (sourcePlatform: PlatformCredentials) => {
    const credentials = sourcePlatform?.credentials;

    try {
        const response = await fetch(`https://api.newplatform.com/v1/media`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${credentials?.secretKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const res = await response.json();
            return { success: true, response: res };
        } else {
            return { success: false, message: 'Failed to fetch media from New Platform' };
        }
    } catch (error) {
        return { success: false, message: error?.message || 'Failed to fetch media from New Platform' };
    }
};

// Create media in Fastpix
const createMedia = async (destinationPlatform: PlatformCredentials, mediaUrl: string, mediaId: string) => {
    const credentials = destinationPlatform?.credentials;
    const config = destinationPlatform?.config;
    const url = 'https://v1.fastpix.io/on-demand';

    const playbackPolicy = config?.playbackPolicy?.length === 1 ? 'public' : 'private';
    const maxResolution = config?.encodingTier || '4K';

    const requestBody = {
        metadata: {
            NewPlatformMediaId: mediaId,
        },
        accessPolicy: playbackPolicy,
        maxResolution,
        inputs: [
            {
                type: 'video',
                url: mediaUrl,
            },
        ],
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${Buffer.from(`${credentials?.publicKey}:${credentials?.secretKey}`).toString('base64')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (response.ok) {
            const res = await response.json();
            return { success: true, response: res };
        } else {
            return { success: false, message: 'Failed to create media in Fastpix' };
        }
    } catch (error) {
        return { success: false, message: error?.message || 'Failed to create media in Fastpix' };
    }
};

// Migration endpoint for New Platform
export default async function POST(request: Request) {
    const data = await request.json();
    const sourcePlatform = data?.sourcePlatform || null;
    const destinationPlatform = data?.destinationPlatform || null;

    if (!sourcePlatform || !destinationPlatform) {
        return new Response(JSON.stringify({ message: 'Source or destination platform is missing' }), { status: 400 });
    }

    const fetchResult = await fetchNewPlatformMedia(sourcePlatform);

    if (!fetchResult.success) {
        return new Response(JSON.stringify({ message: fetchResult.message }), { status: 400 });
    }

    const mediaList = fetchResult?.response?.data || [];
    const createdMedia = [];
    const failedMedia = [];

    for (const media of mediaList) {
        const mediaUrl = media?.assets?.mp4 || '';
        const mediaId = media?.id || '';

        if (mediaUrl) {
            const result = await createMedia(destinationPlatform, mediaUrl, mediaId);
            if (result.success) {
                createdMedia.push(result.response);
            } else {
                failedMedia.push({ mediaId, error: result.message });
            }
        }
    }

    if (createdMedia.length > 0) {
        return new Response(JSON.stringify({ success: true, createdMedia, failedMedia }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } else {
        return new Response(JSON.stringify({ message: 'No media were created' }), { status: 400 });
    }
}
