import { GameResultModal } from "@/components/GameResultModal";

type DailyKniffeRewardModalProps = {
  dateKey: string;
  onClose: () => void;
  onShare: () => void;
  onViewed: () => void;
  streak: number;
  total: number;
  visible: boolean;
};

export function DailyKniffeRewardModal({ dateKey, onClose, onShare, onViewed, streak, total, visible }: DailyKniffeRewardModalProps) {
  return (
    <GameResultModal
      actionLabel="Weiter"
      dateKey={dateKey}
      message={`${total}/${total} erledigt · Serie ${streak || 1}`}
      onHome={onClose}
      onNext={onClose}
      onShare={onShare}
      onViewed={onViewed}
      outcome="won"
      secondaryLabel="Schließen"
      shareText={`Wortkniff Tageskniffe ${dateKey}\n${total}/${total} geschafft · Serie ${streak || 1}`}
      stats={[
        { label: "Tageskniffe", value: `${total}/${total}` },
        { label: "Serie", value: streak || 1 },
      ]}
      success
      title="Tageskniffe geschafft"
      visible={visible}
    />
  );
}
