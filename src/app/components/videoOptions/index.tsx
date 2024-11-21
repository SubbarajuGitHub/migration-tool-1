import Heading from '../heading';
import useMigrationStore from '../utils/store';

const VideoOptions =() =>{
  const setCurrentStep = useMigrationStore((state) => state.setCurrentStep);
  const setAssetFilter = useMigrationStore((state)=> state.setAssetFilter);

  return (
    <div>
      <div className="mb-4 p-4">
        <Heading>Select your videos</Heading>
        <p className="font-normal text-[15px] pt-[5px">What specific items do you wish to migrate?</p>
      </div>

      <div className="flex">
        <button
          className="py-[12px] px-[16px] bg-black text-white max-h-[44px] rounded-lg"
          onClick={() => {
            setAssetFilter([]);
            setCurrentStep('select-destination');
          }}
        >
       Transfer Everything
        </button>
        <div className='flex flex-col items-center'>
        <button
          disabled
          className="py-[12px] px-[16px] bg-white text-black border border-black ml-[20px] rounded-lg"
        >
          Let me choose
          <br />
        </button>
        <span className="text-[12px] font-normal mt-[10px]">Coming soon</span>
        </div>
        </div>
    </div>
  );
}

export default VideoOptions