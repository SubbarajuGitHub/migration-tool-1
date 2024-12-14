import { NextRequest, NextResponse } from 'next/server';
import processVideosForPlatform from "../fastpix/route";

interface MetaData {
    environment: string,
    platformId: string
}

interface LogoImage {
    key: null,
    props: Record<string, string>,
    _owner: string,
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

interface Media {
    video_quality: string;
    tracks: Array<Record<string, unknown>>;
    test: boolean;
    status: string;
    resolution_tier: string;
    progress: Record<string, string>;
    playback_ids: Array<Record<string, unknown>>;
    mp4_support: string;
    max_stored_resolution: string;
    max_stored_frame_rate: number;
    max_resolution_tier: string;
    master_access: string;
    master: Record<string, string>;
    ingest_type: string;
    id: string;
    encoding_tier: string;
    duration: number;
    created_at: string;
    aspect_ratio: string;
}

// Get media by ID from Mux
const getMedia = async (sourcePlatform: PlatformCredentials, videoId: string) => {
    const credentials = sourcePlatform?.credentials ? sourcePlatform.credentials : null;

    try {
        const response = await fetch(`https://api.mux.com/video/v1/assets/${videoId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(`${credentials?.publicKey}:${credentials?.secretKey}`).toString('base64')
            }
        });

        if (response.ok) {
            const res = await response.json();
            return { success: true, response: res };
        } else {
            return { success: false, message: "Failed to get media by ID from Mux" };
        }
    } catch (error) {
        return { success: false, message: "Failed to get media by ID from Mux" };
    }
}

// Fetch all Mux media for a particular workspace
const fetchMuxMedia = async (sourcePlatform: PlatformCredentials) => {
    const credentials = sourcePlatform?.credentials ? sourcePlatform.credentials : null;
    let allVideos: Media[] = [];
    let url = 'https://api.mux.com/video/v1/assets';
    let isMorePages = true;

    try {
        while (isMorePages) {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + Buffer.from(`${credentials?.publicKey}:${credentials?.secretKey}`).toString('base64')
                }
            });

            if (response.ok) {
                const res = await response.json();
                const videos = res.data ?? [];

                allVideos = allVideos.concat(videos);

                const nextPage = res.links?.next;
                if (nextPage) {
                    url = nextPage;
                } else {
                    isMorePages = false;
                }
            } else {
                return { success: false, message: "Failed to get media from Mux" };
            }
        }

        return { success: true, response: allVideos };
    } catch (error) {
        return { success: false, message: "Failed to get media from Mux" };
    }
};

// Get master access for non-mp4 video media
const createMasterAccess = async (sourcePlatform: PlatformCredentials, videoId: string) => {
    const credentials = sourcePlatform?.credentials ? sourcePlatform.credentials : null;
    const requestBody = { "master_access": "temporary" };

    try {
        const response = await fetch(`https://api.mux.com/video/v1/assets/${videoId}/master-access`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(`${credentials?.publicKey}:${credentials?.secretKey}`).toString('base64')
            },
            body: JSON.stringify(requestBody)
        });

        if (response.status === 200) {
            const res = await response.json();
            return { success: true, response: res };
        } else {
            return { success: false, message: "Failed to get Master Access for Media" };
        }
    } catch (error) {
        return { success: false, message: "Failed to get Master Access for Media" };
    }
}

// Migration API to handle Mux to Fastpix
export async function POST(request: NextRequest) {
    const data = await request.json();
    const sourcePlatform = data?.sourcePlatform ?? null;
    const destinationPlatform = data?.destinationPlatform ?? null;

    const result = await fetchMuxMedia(sourcePlatform);

    if (!result.success) {
        return new NextResponse(
            JSON.stringify({ success: false, error: 'Failed to fetch media from Mux' }),
            { status: 400 }
        );
    }

    const videos = result?.response ?? [];
    const videoData: { videoId: string, mp4_support: string, playbackId: any }[] = [];
    const masterAccessNeeded: string[] = []; // Store media IDs needing master access

    // Process each video
    for (const video of videos) {
        const videoId = video?.id;
        const playbackId = video?.playback_ids?.[0]?.id;
        const mp4_support = video?.mp4_support;
        const master_access = video?.master?.url;
        
        if (mp4_support !== "none" || master_access !== undefined) {

            // If mp4_support exists, push video data directly
            const url = mp4_support !== "none" ? mp4_support : master_access;
            videoData.push({ videoId, mp4_support: url, playbackId: playbackId });

        } else {
            // If mp4_support does not exist, create master access
            const createdMasterAccess = await createMasterAccess(sourcePlatform, videoId);

            if (createdMasterAccess?.success) {
                const mediaId = createdMasterAccess?.response?.data?.id;
                masterAccessNeeded.push(mediaId);  // Add to master access list
            }
        }
    }

    if (masterAccessNeeded.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 30000));

        for (const mediaId of masterAccessNeeded) {
            const getMediaById = await getMedia(sourcePlatform, mediaId);
            if (getMediaById?.success && getMediaById?.response?.data?.master?.status === "ready") {
                const mp4_support = videos.find(video => video.id === mediaId)?.mp4_support;
                videoData.push({ videoId: mediaId, mp4_support, playbackId: null });
            }
        }
    }

    if (videoData.length > 0) {

        const result = await processVideosForPlatform(destinationPlatform, videoData, "mux");
        const createdMedia = result.createdMedia
        const failedMedia = result.failedMedia

        if (createdMedia.length > 0 || failedMedia.length > 0) {
            return NextResponse.json(
                { success: true, createdMedia, failedMedia },
                { status: 200 }
            );
        } else {
            const errorMsg = videos.length === 0 ? "No Vidoes found in Mux Video" : "Failed to create Media"
            return NextResponse.json(
                { error: errorMsg },
                { status: 400 }
            );
        }
    } else {
            const errorMsg = videos.length === 0 ? "No Vidoes found in Mux Video" : "Failed to create Media"
            return NextResponse.json(
                { error: errorMsg },
                { status: 400 }
            );
        }
}
