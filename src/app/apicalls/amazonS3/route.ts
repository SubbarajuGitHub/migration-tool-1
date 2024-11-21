import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

interface MetaData {
    environment: string;
    platformId: string;
    bucket?: string;
    region?: string
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
    accessKeyId: string;
    secretAccessKey: string;
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

// Fetch videos from S3 bucket
const fetchS3Media = async (sourcePlatform: PlatformCredentials) => {
    const { publicKey, secretKey, additionalMetadata } = sourcePlatform.credentials;
    const { bucket, region } = additionalMetadata;

    const s3 = new S3Client({
        credentials: {
            accessKeyId: publicKey,
            secretAccessKey: secretKey,
        },
        region: region,
    });

    let videos: Array<any> = [];
    let continuationToken: string | undefined = undefined;

    try {
        do {
            const command = new ListObjectsV2Command({
                Bucket: bucket,
                ContinuationToken: continuationToken,
            });

            const response = await s3.send(command);

            const filteredVideos = response.Contents?.filter(file => file.Key?.endsWith(".mp4")) || [];
            videos = [...videos, ...filteredVideos];
            continuationToken = response?.NextContinuationToken ?? "";

        } while (continuationToken);

        return {
            success: true,
            response: videos.map(video => ({
                key: video.Key,
                url: `https://${bucket}.s3.amazonaws.com/${video.Key}`,
            }))
        };

    } catch (error) {

        return { success: false, message: error?.message ?? "Failed to fetch video from API Video" };
    }
};

// Create media asset using source file in Fastpix
const createMedia = async (
    destinationPlatform: PlatformCredentials,
    mp4Url: string,
    fileKey: string
) => {
    const credentials = destinationPlatform?.credentials;
    const url = "https://v1.fastpix.io/on-demand";

    const playbackPolicy = destinationPlatform?.config?.playbackPolicy?.length  === 1 ? "public" : "private";
    const testmode = destinationPlatform?.config?.testMode ? destinationPlatform.config.testMode : null;

    const requestBody = {
        metadata: {
            s3Key: fileKey,
        },
        accessPolicy: playbackPolicy,
        inputs: [
            {
                type: "video",
                url: mp4Url,
                ...(testmode === "1" ? { startTime: 0, endTime: 10 } : {})
            },
        ],
        mp4Support: "capped_4k",
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Basic ${Buffer.from(
                    `${credentials.publicKey}:${credentials.secretKey}`
                ).toString("base64")}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (response.ok) {
            const res = await response.json();

            return {
                sucess: true,
                response: res
            }
           
        } else {
            return { success: false, message: "Failed to create media on fastpix" };
        }

    } catch (error) {

        return { success: false, message: error?.message ?? "Failed to create media on fastpix" };
    }
};

// POST API Endpoint
export default async function POST(request: Request) {
        const data = await request.json();
        const sourcePlatform = data?.sourcePlatform as PlatformCredentials;
        const destinationPlatform = data?.destinationPlatform as PlatformCredentials;

        const response = await fetchS3Media(sourcePlatform);

        if (!response.success) {

            return new Response(JSON.stringify({ message: response.message ?? "No videos found in S3 bucket" }), { status: 404 });
        }
        const videos = response?.response ?? []
        const createdMedia = [];

        for (const video of videos) {
            const createdMediaEntry = await createMedia(destinationPlatform, video?.url, video?.key);

            if (createdMediaEntry?.response) {
                createdMedia.push(createdMediaEntry?.response);
            }
        }

        if (createdMedia.length > 0) {

            return new Response(
                JSON.stringify({ success: true, createdMedia }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
        } else {

            return new Response(
                JSON.stringify({ message: "No media could be created" }),
                { status: 400 }
            );
        }
}
