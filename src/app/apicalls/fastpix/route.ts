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

const createMediaInFastPix = async (destinationPlatform: PlatformCredentials, mp4_support: string, videoId: string) => {
    const credentials = destinationPlatform?.credentials ? destinationPlatform.credentials : null;
    const url = 'https://v1.fastpix.io/on-demand';

    const config = destinationPlatform?.config ? destinationPlatform.config : null;
    const maxResolutionTier = config?.maxResolutionTier ? config.maxResolutionTier : "1080p";
    const playbackPolicy = config?.playbackPolicy?.[0];

    const requestBody = {
        "metadata": {
            "originPlaformVideoId": videoId,
        },
        "accessPolicy": playbackPolicy,
        "maxResolution": maxResolutionTier,
        "inputs": [
            {
                type: 'video',
                url: `${mp4_support}`,
            },
        ],
        "mp4Support": "capped_4k",
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
            return { success: false, statusCode: response?.status, message: response?.statusText ?? "Failed to create media in fastpix" };
        }
    } catch (error) {

        return { success: false, message: error?.message ?? "Failed to create media in fastpix" };
    }
};

const processVideosForPlatform = async (destinationPlatform: PlatformCredentials, videos:[any], productType: string) => {
    const createdMedia = [];
    const failedMedia = [];
 
    const createMediaPromises = videos.map((video) => {
 
        // conditions to get download url dynamically
        let mp4Url = "";
        if (productType === "vimeo"){
            const mp4Asset = video?.download?.find((file) => file.quality === 'source');
            mp4Url = mp4Asset ? mp4Asset?.link : null;
        } else {
            mp4Url = productType === "apivideo" ? video?.assets?.mp4 : productType === "amazon-s3" ? video?.url : productType === "cloudfare" ? video?.downloadurl : productType === "mux" ? video?.mp4_support?.startsWith("https://master.mux.com") ? video?.mp4_support : `https://stream.mux.com/${video?.playbackId}/${video?.mp4_support}.mp4` : ""
        }
        
        // conditions to get video id dynamically
        let videoId= "";
        if (productType === "vimeo"){
            videoId = video?.link.split("/")?.at(-1)
        } else if (productType === "amazon-s3") {
            videoId = video?.key
        } else {
            videoId = video?.videoId;
        }

        if (mp4Url !== "") {
            return createMediaInFastPix(destinationPlatform, mp4Url, videoId).then((result) => ({
                videoId,
                ...result,
            }));
        } else {
            return Promise.reject({
                videoId,
                success: false,
                message: "MP4 URL is 'none'",
            });
        }
    });

    const results = await Promise.allSettled(createMediaPromises);

    results.forEach((result) => {
        if (result?.status === "fulfilled") {
            if (result?.value?.success) {
                createdMedia.push(result?.value?.response);
            } else {
                failedMedia.push({ videoId: result?.value?.videoId, error: result?.value?.message });
            }
        } else if (result.status === "rejected") {
            failedMedia.push({ videoId: null, error: result?.reason?.message ?? "Unknown error" });
        }
    });

    return { createdMedia, failedMedia };
};

export default processVideosForPlatform
