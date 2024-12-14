import processVideosForPlatform from "../fastpix/route";
import { NextRequest, NextResponse } from "next/server";

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
    else if (result?.response?.result?.length === 0) {
        return NextResponse.json({ success: false, message: "No Vidoes found in Cloudfare Video" }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        };
    }

    const videos = result?.response?.result ?? []; // Cloudflare video media
    let allDownloadUrls = 0;
    const videoData = [];  // Store video IDs and download URLs

    for (const video of videos) {
        const videoId = video.uid;
        const response = await getDownloadUrl(sourcePlatform, videoId);
        const downloadurl = response?.response?.result?.default?.url ?? "";
        allDownloadUrls += 1;

        videoData.push({ videoId, downloadurl });

    }

    if (videos.length === allDownloadUrls) {
        await new Promise(resolve => setTimeout(resolve, 30000));

        const result = await processVideosForPlatform(destinationPlatform, videoData, "cloudfare")
            
        const createdMedia = result.createdMedia
        const failedMedia = result.failedMedia

        if (createdMedia.length > 0 || failedMedia.length > 0) {
            return NextResponse.json(
                { success: true, createdMedia, failedMedia },
                { status: 200 }
            );
        } else {
            const errorMsg = videos.length === 0 ? "No Vidoes found in Cloudfare Video" : "Failed to create Media"
            return NextResponse.json(
                { error:  errorMsg},
                { status: 400 }
            );
        }
    }

}
