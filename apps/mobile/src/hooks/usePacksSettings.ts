import { useEffect, useState } from "react";
import { getDefaultPacksSettings, loadPacksSettings, type PacksSettings } from "@/storage/packs";
import { hasPremiumAccess, isPackGated } from "@/premium/packsAccess";

// Returns effective packs — if gated and no premium, bio is forced off (UI already prevents enabling, this is safety).
export function usePacksSettings() {
  const [packs, setPacks] = useState<PacksSettings>(getDefaultPacksSettings());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [stored, hasPremium] = await Promise.all([loadPacksSettings(), hasPremiumAccess()]);
      if (cancelled) return;
      const gated = isPackGated();
      // Safety gate: if gated without premium, disable bio regardless of stored value
      const effective: PacksSettings = gated && !hasPremium ? { ...stored, bio: { ...stored.bio, enabled: false } } : stored;
      setPacks(effective);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  return { packs, loaded, setPacks } as const;
}
