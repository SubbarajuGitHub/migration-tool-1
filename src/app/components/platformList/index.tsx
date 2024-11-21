
import Heading from "../heading";
import APIvideoIcon from "../icons/apivideo";
import CloudfareIcon from "../icons/cloudfare";
import MuxLogo from "../icons/mux";
import FastpixLogo from "../icons/fastpix";
import useMigrationStore from "../utils/store";
import S3AmazonIcon from "../icons/s3amazon";
import Vimeoicon from "../icons/viemo";

interface PlatformListProps {
  type: string
}

interface Logo {
  key: string
  props: {}
  _owner: string
  _store: string
}

interface Platform {
  id: string,
  name: string,
  logo: Logo,
  width: string,
  height: string
}

const platform = {
  source: [
    {
      id: 'mux',
      name: 'Mux',
      logo: <MuxLogo />,
      width: "140",
      height: "32"
    },
    {
      id: 'api-video',
      name: 'Api.video',
      logo: <APIvideoIcon />,
      width: "140",
      height: "32"
    },
    {
      id: 'cloudflare-stream',
      name: 'Cloudflare Stream',
      logo: <CloudfareIcon />,
      width: "140",
      height: "32"
    },
    {
      id: 's3',
      name: 'Amazon S3',
      logo: <S3AmazonIcon />,
      width: "140",
      height: "32"
    },
    {
      id: "vimeo",
      name: "Vimeo",
      logo: <Vimeoicon />,
      width: "140",
      height: "32"
    }
  ],
  destination: [
    {
      id: 'fastPix',
      name: 'FastPix',
      logo: <FastpixLogo />,
      width: "140",
      height: "32"
    },
  ],
};

const PlatformList: React.FC<PlatformListProps> = (props) => {
  const setCurrentStep = useMigrationStore((state) => state.setCurrentStep);
  const setPlatform = useMigrationStore((state) => state.setPlatform);

  const handlePlatformClick = (each: Platform) => {
    setCurrentStep(props?.type === "source" ? "set-source-credentials" : "set-destination-credentials");
    setPlatform(props?.type, each);
  };

  const heading = props?.type === "source" ? "Choose a Source Platform" : "Choose your Destination";
  const text = props?.type === "source"
    ? "Choose the platform where your videos are currently hosted"
    : "Select the platform to which you are transferring your videos.";

  return (
    <div className="w-full p-4">
      <Heading>{heading}</Heading>
      <p className="font-normal text-[15px] pt-[5px]">{text}</p>
      <div className="w-full mt-[40px] gap-y-[20px] md:gap-x-[40px] md:flex md:flex-row flex-wrap">
        {(props?.type === "source" ? platform.source : platform.destination).map((each) => (
          <div key={each.id} className="w-full max-w-[100%] md:max-w-[30%] flex flex-col items-center" onClick={() => handlePlatformClick(each)}>
            <div className="w-full hover:border hover:border-black border border-foggy-gray rounded-lg h-[112px] flex justify-center items-center">
              <span
                style={{
                  maxWidth: `${each.width}px`,
                  maxHeight: `${each.height}px`,
                  display: "flex",
                  justifyContent:"center",
                  alignItems: "center"
                }}
              >
                {each.logo}
              </span>
            </div>
            <div className="pt-[20px] text-slate-gray text-center mb-[20px] md:mb-[0px]">{each.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlatformList;
