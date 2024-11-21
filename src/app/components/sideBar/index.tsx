
import useMigrationStore from "../utils/store";
import Heading from "../heading"

const SideBar = () => {

    const sourcePlatform = useMigrationStore((state) => state.sourcePlatform);
    const setPlatform = useMigrationStore((state) => state.setPlatform);
    const setCurrentStep = useMigrationStore((state) => state.setCurrentStep);
    const assetFilter = useMigrationStore((state) => state.assetFilter);
    const setAssetFilter = useMigrationStore((state) => state.setAssetFilter);
    const destinationPlatform = useMigrationStore((state) => state.destinationPlatform);
    const setOriginvidoesList = useMigrationStore((state) => state.setOriginVideos);
    const setMasterAccessVideos = useMigrationStore((state) => state.setMasterAccessVideos);
    const setMigrationError = useMigrationStore((state) => state.setMigrationError);
    const currentStep = useMigrationStore((state) => state.currentStep);
    
    return (
        <div className="w-full p-4">
            <div className="border border-light-grayish-blue md:border-none p-4 md:p-[0px]">
                <Heading>Moving list</Heading>
                <p className="text-slate-gray font-normal text-[15px] py-[20px]">This list will build as you get ready for your move.</p>

                {sourcePlatform && (
                    <div className={`flex justify-between border p-2 rounded-lg mb-[20px] ${currentStep === "set-source-credentials" ? "border-black" : "border-foggy-gray"}`}>
                        <div className="flex flex-col">
                            <p className="font-semibold text-[15px]">Origin Platform</p>
                            <p className="text-[15px] font-[400px] text-slate-gray">{sourcePlatform?.name}</p>
                        </div>

                        <button
                            onClick={() => {
                                setPlatform('source', null);
                                setCurrentStep('select-source');
                            }}
                            className="text-3xl text-primary"
                            aria-label={`Remove ${sourcePlatform?.name} as source platform`}
                        >
                            &times;
                        </button>
                    </div>
                )}

                {sourcePlatform?.credentials && (
                    <div className={`flex justify-between border p-2 rounded-lg mb-[20px] ${currentStep === "set-video-filter" ? "border-black" : "border-foggy-gray"}`}>
                        <div className="flex flex-col">
                            <h3 className="font-semibold text-[15px]">Origin Credentials</h3>
                            <p className="text-[15px] font-[400px] text-slate-gray">Add your credentials</p>
                        </div>

                        <button
                            className="text-3xl text-primary"
                            onClick={() => {
                                setPlatform('source', { ...sourcePlatform, credentials: undefined });
                                setCurrentStep('set-source-credentials');
                            }}
                        >
                            &times;
                        </button>
                    </div>
                )}

                {assetFilter !== null && (
                    <div className={`flex justify-between border p-2 rounded-lg mb-[20px] ${currentStep === "select-destination" ? "border-black" : "border-foggy-gray"}`}>
                        <div className="flex flex-col">
                            <h3 className="font-semibold text-[15px]">Video selection</h3>
                            <p className="text-[15px] font-[400px] text-slate-gray">Select transfer range</p>
                        </div>

                        <button
                            className="text-3xl text-primary"
                            onClick={() => {
                                setAssetFilter(null);
                                setCurrentStep('set-video-filter');
                            }}
                        >
                            &times;
                        </button>
                    </div>
                )}

                {destinationPlatform && (
                    <div className={`flex justify-between border p-2 rounded-lg mb-[20px] ${currentStep === "set-destination-credentials" ? "border-black" : "border-foggy-gray"}`}>
                        <div className="flex flex-col">
                            <h3 className="font-semibold text-[15px]">Target Platform</h3>
                            <p className="text-[15px] font-[400px] text-slate-gray">{destinationPlatform?.name}</p>
                        </div>

                        <button
                            className="text-3xl text-primary"
                            onClick={() => {
                                setPlatform('destination', null);
                                setCurrentStep('select-destination');
                            }}
                        >
                            &times;
                        </button>
                    </div>
                )}

                {destinationPlatform?.credentials && (
                    <div className={`flex justify-between border p-2 rounded-lg mb-[20px] ${currentStep === "set-import-settings" ? "border-black" : "border-foggy-gray"}`}>
                        <div className="flex flex-col">
                            <h3 className="font-semibold text-[15px]">Target credentials</h3>
                            <p className="text-[15px] font-[400px] text-slate-gray">Add your credentials </p>
                        </div>

                        <button
                            className="text-3xl text-primary"
                            onClick={() => {
                                setPlatform('destination', { ...destinationPlatform, credentials: undefined });
                                setCurrentStep('set-destination-credentials');
                            }}
                        >
                            &times;
                        </button>
                    </div>
                )}

                {destinationPlatform?.config && (
                    <div className={`flex justify-between border p-2 rounded-lg mb-[20px] ${currentStep === "review" ? "border-black" : "border-foggy-gray"}`}>
                        <div className="flex flex-col">
                            <h3 className="font-semibold text-[15px]">Import settings</h3>
                            <p className="text-[15px] font-[400px] text-slate-gray">Settings added</p>
                        </div>

                        <button
                            className="text-3xl text-primary"
                            onClick={() => {
                                setPlatform('destination', { ...destinationPlatform, config: undefined });
                                setCurrentStep('set-import-settings');
                                setOriginvidoesList([]);
                                setMasterAccessVideos([]);
                                setMigrationError([]);
                            }}
                        >
                            &times;
                        </button>
                    </div>
                )}

            </div>
        </div>
    )
}
export default SideBar
