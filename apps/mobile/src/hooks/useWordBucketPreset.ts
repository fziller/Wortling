import { useEffect, useState } from "react";

import { BucketPreset } from "@/games/wordBuckets";
import { getBucketBooleans, getPreset, loadWordBucketSettings } from "@/storage/wordBuckets";

export function useWordBucketPreset(): BucketPreset {
  const [preset, setPreset] = useState<BucketPreset>("klassisch");

  useEffect(() => {
    loadWordBucketSettings().then((settings) => setPreset(getPreset(settings)));
  }, []);

  return preset;
}

export function useWordBucketSettingsState() {
  const [settings, setSettings] = useState({ erweitert: false, hart: false });
  const preset = getPreset(settings);

  useEffect(() => {
    loadWordBucketSettings().then(setSettings);
  }, []);

  return { settings, preset, setSettings };
}
