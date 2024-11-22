interface MetaData {
    environment: string,
    platformId: string
}

interface LogoImage {
    key: null,
    props: Record<string, string>,
    _onwer: string,
    _store: Record<string, string>
}

interface Credentials {
    publicKey: string,
    secretKey: string,
    logo: LogoImage
    additionalMetadata: MetaData
}

interface VideoConfig {
    encodingTier: string,
    playbackPolicy: Array<string>
}

interface PlatformCredentials {
    id: string,
    name: string,
    credentials: Credentials,
    config?: VideoConfig
}

// fetchCloudflareMedia.js
const fetchCloudflareMedia = async (sourcePlatform: PlatformCredentials) => {
    const credentials = sourcePlatform?.credentials ? sourcePlatform.credentials : null;

    try {
        const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${credentials.publicKey}/stream`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${credentials?.secretKey ? credentials.secretKey : null}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const res = await response.json();

            return { success: true, response: res };
        } else {

            return { success: false, message: "Failed to fetch Cloudflare videos" };
        }
    } catch (error) {

        return { success: false, message: error?.message ?? "Failed to fetch Cloudflare videos" };
    }
};

// create media in fastpix
const createMedia = async (destinationPlatform: PlatformCredentials, mp4_support: string, videoId: string) => {
    const credentials = destinationPlatform?.credentials ? destinationPlatform.credentials : null;
    const url = 'https://v1.fastpix.io/on-demand';

    const config = destinationPlatform?.config ? destinationPlatform.config : null;
    const maxResolutionTier = config?.maxResolutionTier ? config.maxResolutionTier : null;
    const playbackPolicy = config?.playbackPolicy?.length === 1 ? "public" : "private";
    const testmode = config?.testMode ? config.testMode : null;

    const requestBody = {
        metadata: {
            "CloudflareVideoId": videoId,
        },
        accessPolicy: playbackPolicy,
        maxResolution: maxResolutionTier,
        inputs: [
            {
                type: 'video',
                url: `${mp4_support}`,
                ...(testmode === "1" ? { startTime: 0, endTime: 10 } : {})
            },
        ],
        mp4Support: "capped_4k",
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(`${credentials?.publicKey ? credentials.publicKey : null}:${credentials?.secretKey ? credentials.secretKey : null}`).toString('base64')
            },
            body: JSON.stringify(requestBody),
        });

        if (response.ok) {

            const res = await response.json();
            return { success: true, response: res };
        } else {

            return { success: false, message: "Failed to create media in fastpix" };
        }
    } catch (error) {

        return { success: false, message: error?.message ?? "Failed to create media in fastpix" };
    }
};

// get download url from Cloudflare
const getDownloadUrl = async (sourcePlatform: PlatformCredentials, videoId: string) => {
    const credentials = sourcePlatform?.credentials ? sourcePlatform.credentials : null;

    try {
        const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${credentials.publicKey}/stream/${videoId}/downloads`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${credentials?.secretKey ? credentials.secretKey : null}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {

            const res = await response.json();

            return { success: true, response: res };
        } else {

            return { success: false, message: "Failed to get .mp4 file from cloudfare" };
        }
    } catch (error) {

        return { success: false, message: error?.message ?? "Failed to get .mp4 file from cloudfare" };
    }
}

// Cloudflare migration endpoint
export async function POST(request: Request) {
    const data = await request.json();
    const sourcePlatform = data?.sourcePlatform ? data.sourcePlatform : null;
    const destinationPlatform = data?.destinationPlatform ? data?.destinationPlatform : null;

    const result = await fetchCloudflareMedia(sourcePlatform);

    if (!result.success) {

        return new Response(JSON.stringify({ message: 'Failed to fetch media from Cloudflare' }), { status: 400 });
    }

    const videos = result?.response?.result ?? []; // Cloudflare video media
    const createdMedia = [];

    for (const video of videos) {
        const videoId = video.uid;
        const response = await getDownloadUrl(sourcePlatform, videoId);
        const downloadurl = response?.response?.result?.default?.url ?? "";

        const createdMediaItem = await createMedia(destinationPlatform, downloadurl, videoId);
        if (createdMediaItem?.response) {
            createdMedia.push(createdMediaItem?.response);
        }
    }

    if (createdMedia.length > 0) {

        return new Response(JSON.stringify({ success: true, createdMedia }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } else {

        return new Response(JSON.stringify({ message: 'No media were created' }), { status: 400 });
    }

}
