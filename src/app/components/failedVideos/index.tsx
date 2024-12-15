import FailedIcon from "../icons/error";

export default function FailedVideos({ failedVideos }) {

    return (
        <>
        <div className="w-full">
            <div className="grid grid-cols-[50px_2fr_1fr_1fr] bg-[#F2F2F6] static top-0">
                <div className="px-4 text-[12px] text-[#808091] py-2 text-left">SL.NO</div>
                <div className="px-4 text-[12px] text-[#808091] py-2 text-left">VIDEO ID</div>
                <div className="px-4 text-[12px] text-[#808091] py-2 text-left">STATUS CODE</div>
                <div className="px-4 text-[12px] text-[#808091] py-2 text-left">ERROR MESSAGE</div>
            </div>

            {failedVideos?.map((video, index) => (
                <div
                    key={index}
                    className="border-b last:border-none overflow-hidden"
                >
                    <div className="grid grid-cols-[50px_2fr_1fr_1fr] bg-white m-2">
                        <div className="px-4 py-2 text-[12px] text-left">{index + 1}</div>
                        <div className="px-4 py-2 text-[12px] text-left">{video?.videoId ?? null}</div>
                        <div className="px-4 py-2 text-[12px] text-left">{video?.code ?? 400}</div>
                        <div className="px-4 py-2 text-[12px] text-left flex gap-x-2 bg-[#FBE1DF] rounded">
                            <span className="text-[#E20E0E]"><FailedIcon /></span>
                            <span className="text-[#E20E0E] font-semibold">{video?.message ?? null}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        </>
    );
}
