import React, { useEffect } from "react";
import Heading from "../heading";
import CreatedIcon from "../icons/created";
import useMigrationStore from "../utils/store";
import Loading from "../loading";
import FailedIcon from "../icons/error";

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
    const migrationError = useMigrationStore((state) => state.migrationError);
    const failedVideos = useMigrationStore((state) => state.failedVideos);

    return (
        <div className="p-2">
            <Heading>REVIEW</Heading>

            <p className="mt-[10px]">Before the big move, there&apos;s one</p>

            {isVideosMigrating ? (
                <div className="max-w-[900px] overflow-auto gap-y-4 flex flex-col justify-center items-center mt-[40px] h-[60vh]">
                    <h2 className="text-xl md:text-xl font-semibold">Videos are currently migrating. Please stay on this page, as the process may take a few moments.</h2>
                    <Loading />
                </div>
            ) : (
                <div className="max-w-[900px]">
                    <div className="overflow-x-auto rounded-lg mt-[40px] border border-light-grayish-blue max-h-[500px]">
                        {/* Header */}
                        <div className="grid grid-cols-[1fr_2fr_1fr] bg-[#F2F2F6] static top-0">
                            <div className="px-4 text-[12px] text-[#808091] py-2 text-left">SL.NO</div>
                            <div className="px-4 text-[12px] text-[#808091] py-2 text-left">VIDEO ID</div>
                            <div className="px-4 text-[12px] text-[#808091] py-2 text-left">STATUS</div>
                        </div>

                        {migrationError?.[0]?.error === 'True' && (
                            <p className="text-xl text-red-700 font-bold p-4 text-center">
                                Failed to migrate videos due to {migrationError?.[0]?.message}
                            </p>
                        )}

                        {/* Render originPlatformVideos */}
                        {originPlatformVideos?.map((video, index) =>
                            video?.data?.id ? (
                                <div key={index} className="grid grid-cols-[1fr_2fr_1fr] border">
                                    <div className="px-4 py-2 text-sm sm:text-base">{index + 1}</div>
                                    <div className="px-4 py-2 text-sm sm:text-base">{video?.data?.id}</div>
                                    <div className="px-4 py-2 text-sm sm:text-base">
                                        <div className="bg-[#E3EEFF] w-[120px] p-[5px] flex gap-x-2 items-center rounded-lg">
                                            <span><CreatedIcon /></span>
                                            <span className="text-[#0B5EE4] text-[12px]">CREATED</span>
                                        </div>
                                    </div>
                                </div>
                            ) : null
                        )}
                        {failedVideos?.map((video, index) => (
                            <div key={index} className="grid grid-cols-[1fr_2fr_1fr] border">
                                <div className="px-4 py-2 text-sm sm:text-base">{index + 1}</div>
                                <div className="px-4 py-2 text-sm sm:text-base">{video?.videoId}</div>
                                <div className="px-4 py-2 text-sm sm:text-base">
                                    <div className="bg-[#FBE1DF] p-[5px] flex gap-x-2 items-center rounded-lg">
                                        <span className="text-[#E20E0E]"><FailedIcon /></span>
                                        <span className="text-[#E20E0E] text-[12px]">{video?.error}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MigrationStatus;
