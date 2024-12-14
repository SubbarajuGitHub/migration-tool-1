import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import processVideosForPlatform from "../fastpix/route";

interface MetaData {
    environment: string;
    platformId: string;
    bucket?: string;
    region?: string;
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

            const filteredVideos = response.Contents?.filter(file => file.Key?.endsWith('.mp4')) || [];
            videos = [...videos, ...filteredVideos];
            continuationToken = response?.NextContinuationToken ?? '';
        } while (continuationToken);

        return {
            success: true,
            response: videos.map(video => ({
                key: video.Key,
                url: `https://${bucket}.s3.amazonaws.com/${video.Key}`,
            })),
        };
    } catch (error) {
        return { success: false, message: error?.message ?? 'Failed to fetch video from API Video' };
    }
};

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const sourcePlatform = data?.sourcePlatform as PlatformCredentials;
        const destinationPlatform = data?.destinationPlatform as PlatformCredentials;

        const response = await fetchS3Media(sourcePlatform);

        if (!response.success) {
            return NextResponse.json(
                { message: response.message ?? 'No videos found in S3 bucket' },
                { status: 404 }
            );
        }

        const videos = response?.response ?? [];
        const result = await processVideosForPlatform(destinationPlatform, videos, "amazon-s3");

        const createdMedia = result.createdMedia
        const failedMedia = result.failedMedia

        if (createdMedia.length > 0 || failedMedia.length > 0) {
            return NextResponse.json(
                { success: true, createdMedia, failedMedia },
                { status: 200 }
            );
        } else {
            const errorMsg = videos.length === 0 ? "No Vidoes found in AmazonS3 Video" : "Failed to create Media"
            return NextResponse.json(
                { error:  errorMsg},
                { status: 400 }
            );
        }
        
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message ?? 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
