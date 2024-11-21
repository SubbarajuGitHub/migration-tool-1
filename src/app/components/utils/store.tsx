import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

type MigrationStep =
  | 'select-source'
  | 'set-source-credentials'
  | 'set-video-filter'
  | 'select-videos'
  | 'select-destination'
  | 'set-destination-credentials'
  | 'set-import-settings'
  | 'review'
  | 'migration-status';

type Platform = {
  name: string;
  logo: string;
  credentials?: {
    publicKey: string;
    secretKey?: string;
  };
};

type Video = {
  id: string;
  url?: string;
  title?: string;
  thumbnailUrl?: string;
};

interface MigrationState {
  sourcePlatform: Platform | null;
  destinationPlatform: Platform | null;
  videoOptions: string[] | null;
  assetFilter: string[] | null;
  originVideosList: Video[];
  currentStep: MigrationStep;
  isVideosMigrating: boolean;
}

type MigrationActions = {
  setCurrentStep: (step: MigrationStep) => void;
  setAssetFilter: (filter: string[] | null) => void;
  setPlatform: (type: 'source' | 'destination', platform: Platform | null) => void;
  setOriginVideos: (videos: Video[]) => void;
  setIsVideosMigrating: (value: boolean) => void;
  setMasterAccessVideosIds: (videos: string[]) => void;
  setMasterAccessVideos: (videos: Media[]) => void;
  setMigrationError: (error: Error[]) => void;
};

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

interface Error {
  error: Boolean,
  errorMessage: string
}

const useMigrationStore = create<MigrationState & MigrationActions>()(
  persist(
    immer((set) => ({
      sourcePlatform: null,
      destinationPlatform: null,
      videoOptions: null,
      assetFilter: null,
      originVideosList: [],
      currentStep: 'select-source',
      isVideosMigrating: false,
      masterAccessVideosIds: [],
      masterAccessVideos: [],
      migrationError: {},

      setCurrentStep: (step: MigrationStep) => {
        set({ currentStep: step });
      },

      setAssetFilter: (filter: string[] | null) => {
        set({ assetFilter: filter });
      },

      setPlatform: (type: 'source' | 'destination', platform: Platform | null) => {
        if (type === 'source') {
          set({ sourcePlatform: platform });
        } else {
          set({ destinationPlatform: platform });
        }
      },

      setOriginVideos: (videos: Video[]) => {
        set({ originVideosList: videos });
        set({ isVideosMigrating: false });
      },

      setIsVideosMigrating: (value: boolean) => {
        set({ isVideosMigrating: value });
      },

      setMasterAccessVideosIds: (videos: string[]) => {
        set({ masterAccessVideosIds: videos });
      },

      setMasterAccessVideos: (videos: Media[]) => {
        set({ masterAccessVideos: videos });
      },

      setMigrationError: (error: Error[]) => {
        set({ migrationError: error });
      },
    })),
    {
      name: 'fp-migration-storage',
    }
  )
);

export default useMigrationStore;
