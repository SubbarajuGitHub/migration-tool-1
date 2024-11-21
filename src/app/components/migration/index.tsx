import React, { useEffect } from "react";
import Heading from "../heading";
import CreatedIcon from "../icons/created";
import useMigrationStore from "../utils/store";
import Loading from "../loading";

export interface PlaybackId {
    id: string;
    accessPolicy: string;
}

export interface Metadata {
    muxMediaId: string;
}

export interface VideoData {
    id: string;
    trial: boolean;
    status: string;
    createdAt: string;
    updatedAt: string;
    playbackIds: PlaybackId[];
    metadata: Metadata;
    mp4Support: string;
    maxResolution: string;
}

export interface OriginVideo {
    data: VideoData;
}

const MigrationStatus: React.FC = () => {
    const originPlatformVideos = useMigrationStore((state) => state.originVideosList) as unknown as OriginVideo[] | undefined;
    const isVideosMigrating = useMigrationStore((state) => state.isVideosMigrating);
    const masterAccessVideosIds = useMigrationStore((state) => state.masterAccessVideosIds);
    const sourcePlatform = useMigrationStore((state) => state.sourcePlatform);
    const destinationPlatform = useMigrationStore((state) => state.destinationPlatform);
    const setMasterAccessVideosIds = useMigrationStore((state) => state.setMasterAccessVideosIds);
    const setMasterAccessVideos = useMigrationStore((state) => state.setMasterAccessVideos);
    const masterAccessVideos = useMigrationStore((state) => state.masterAccessVideos);
    const migrationError = useMigrationStore((state) => state.migrationError);

    useEffect(() => {
        const fetchData = async () => {
            if (masterAccessVideosIds?.length >= 1) {
                const requestBody = {
                    "sourcePlatform": sourcePlatform,
                    "videoIds": masterAccessVideosIds,
                    "destinationPlatform": destinationPlatform
                };

                const data = await fetch("/apicalls/mux/masteraccess", {
                    method: 'POST',
                    body: JSON.stringify(requestBody),
                });

                const result = await data.json();
                if (result) {
                    setMasterAccessVideosIds([]);
                    const dataObjects = result?.createdMedia?.map(video => video.data);
                    setMasterAccessVideos(dataObjects)
                }
            }
        };

        const timer = setTimeout(() => {
            fetchData();
        }, 20000);

        return () => clearTimeout(timer);

    }, [masterAccessVideosIds]);

    return (
        <div className="p-2">
            <Heading>REVIEW</Heading>
            <p className="mt-[10px]">Before the big move, there's on</p>
            {isVideosMigrating ? (
                <div className="max-w-[900px] overflow-auto gap-y-4 flex flex-col justify-center items-center mt-[40px] h-[60vh]">
                    <h2 className="text-xl md:text-2xl font-semibold">Videos are migrating...</h2>
                    <Loading />
                </div>
            ) : (
                <div className="max-w-[900px]">

                    {
                        masterAccessVideosIds?.length >= 1 ? (
                            <div className="max-w-[900px] overflow-auto mt-[40px]">
                                <h2>Migration is in still progress wait....</h2>
                            </div>
                        ) : ""
                    }

                    <div className="overflow-x-auto rounded-lg mt-[40px] border border-light-grayish-blue max-h-[500px]">

                        {/* Header */}
                        <div className="grid grid-cols-[1fr_2fr_1fr] bg-[#F2F2F6] static top-0">
                            <div className="px-4 text-[12px] text-[#808091] py-2 text-left">SL.NO</div>
                            <div className="px-4 text-[12px] text-[#808091] py-2 text-left">VIDEO ID</div>
                            <div className="px-4 text-[12px] text-[#808091] py-2 text-left">STATUS</div>
                        </div>

                        {
                            migrationError?.[0]?.error === 'True' ? (<p className="text-xl text-red-700 font-bold p-4 text-center">Failed to migrate videos due to {migrationError?.[0].message}</p>) : ""
                        }

                        {/* Body */}
                        <div>
                            {/* Render originPlatformVideos */}
                            {originPlatformVideos?.map((video, index) =>
                                video?.data?.id ? (
                                    <div key={index} className="grid grid-cols-[1fr_2fr_1fr] border">
                                        <div className="px-4 py-2 text-sm sm:text-base">{index + 1}</div>
                                        <div className="px-4 py-2 text-sm sm:text-base">{video.data?.id}</div>
                                        <div className="px-4 py-2 text-sm sm:text-base">
                                            <div className="bg-[#E3EEFF] w-[120px] p-[5px] flex gap-x-2 items-center rounded-lg">
                                                <span><CreatedIcon /></span>
                                                <span className="text-[#0B5EE4] text-[12px]">CREATED</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : null
                            )}

                            {/* Render masterAccessVideos if length > 1 */}
                            {masterAccessVideos?.length >= 1 &&
                                masterAccessVideos.map((video, index) =>
                                    video?.id ? (
                                        <div key={`master-${index}`} className="grid grid-cols-[1fr_2fr_1fr] border">
                                            <div className="px-4 py-2 text-sm sm:text-base">{index + 1}</div>
                                            <div className="px-4 py-2 text-sm sm:text-base">{video?.id}</div>
                                            <div className="px-4 py-2 text-sm sm:text-base">
                                                <div className="bg-[#E3EEFF] w-[120px] p-[5px] flex gap-x-2 items-center rounded-lg">
                                                    <div className="max-w-[18px] max-h-[18px]"><CreatedIcon /></div>
                                                    <span className="text-[#0B5EE4] text-[12px]">CREATED</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null
                                )
                            }
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default MigrationStatus;
