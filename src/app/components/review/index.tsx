import Heading from "../heading";
import useMigrationStore from "../utils/store";

export default function Review() {

    const setCurrentStep = useMigrationStore((state) => state.setCurrentStep);
    const setOriginvidoesList = useMigrationStore((state) => state.setOriginVideos);
    const sourcePlatform = useMigrationStore((state) => state.sourcePlatform);
    const destinationPlatform = useMigrationStore((state) => state.destinationPlatform);
    const setIsVideosMigrating = useMigrationStore((state) => state.setIsVideosMigrating);
    const setMigrationError = useMigrationStore((state) => state.setMigrationError);

    const setFailedVideos = useMigrationStore((state)=> state.setFailedVideos);

    const changeCurrentStep = async () => {
        setIsVideosMigrating(true);
        const requestBody = {
            "sourcePlatform": sourcePlatform,
            "destinationPlatform": destinationPlatform
        }
        setCurrentStep("migration-status");

        let result

        if (sourcePlatform?.id === "mux") {
            const data = await fetch("/apicalls/mux", {
                method: 'POST',
                body: JSON.stringify(requestBody),
            });

            result = data
        } else if (sourcePlatform?.id === "api-video") {
            const data = await fetch("/apicalls/apivideo", {
                method: 'POST',
                body: JSON.stringify(requestBody),
            });

            result = data
        } else if (sourcePlatform?.id === "cloudflare-stream") {
            const data = await fetch("/apicalls/cloudfare", {
                method: 'POST',
                body: JSON.stringify(requestBody),
            });

            result = data
        } else if (sourcePlatform?.id === "vimeo") {
            const data = await fetch("/apicalls/vimeo", {
                method: 'POST',
                body: JSON.stringify(requestBody),
            });

            result = data
        } else if (sourcePlatform?.id === "s3") {
            const data = await fetch("/apicalls/amazonS3", {
                method: 'POST',
                body: JSON.stringify(requestBody),
            });

            result = data
        }
        const response = await result?.json()

        if (result?.status === 200) {
            if  (response?.createdMedia?.length >= 1) {
                setOriginvidoesList(response?.createdMedia);
            } if (response?.failedMedia?.length >= 1) {
                setFailedVideos(response?.failedMedia)
            }
            setIsVideosMigrating(false);
        } else {
            setIsVideosMigrating(false);

            setMigrationError([
                {   success: true,
                    status: result?.status,
                    message: response?.message ?? response?.error,
                },
            ]); 
        }
    }

    return (
        <div className="p-2 max-w-[450px]">
            <Heading>Review</Heading>
            <p className="text-[15px] mt-[20px]">
                Before proceeding with the migration, there is one crucial final step.Since your video providers typically charge for transferring and storing files, it's essential to understand any costs you may incur during the migration of your videos.
            </p>
            <p className="text-[15px] mt-[20px]">
                By using our migration service, you acknowledge that you are responsible for all actions taken on each platform during the migration, including any fees imposed by your providers.
                To initiate your migration, click "Start Job" in the moving list.
            </p>
            <button className="bg-black py-[12px] hover:bg-gray-800 px-[16px] rounded-lg text-white mt-[20px]" onClick={() => changeCurrentStep()}> Start Job</button>
        </div>
    );
}
