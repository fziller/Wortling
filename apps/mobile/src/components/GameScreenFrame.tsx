import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { tokens } from "@/design/tokens";
import { GAME_HEADER_BACKGROUND, GameHeader } from "@/components/AppHeader";
import { KeyboardLetterState, WordKeyboard } from "@/components/WordKeyboard";
import { Screen } from "@/components/Screen";

export type GameKeyboardConfig = {
  disabled?: boolean;
  letterStates?: Record<string, KeyboardLetterState>;
  onBackspace: () => void;
  onLetter: (letter: string) => void;
  onSubmit: () => void;
  showBackspace?: boolean;
  showSubmit?: boolean;
  submitDisabled?: boolean;
};

type GameScreenFrameProps = {
  actions?: ReactNode;
  children: ReactNode;
  keyboard: GameKeyboardConfig;
  onBack: () => void;
  onHelp: () => void;
  progressLabel?: string;
  subtitle?: string;
  title: string;
};

export function GameScreenFrame({
  actions,
  children,
  keyboard,
  onBack,
  onHelp,
  progressLabel,
  subtitle,
  title,
}: GameScreenFrameProps) {
  return (
    <Screen
      header={<GameHeader onBack={onBack} onHelp={onHelp} progressLabel={progressLabel} subtitle={subtitle} title={title} />}
      headerBackgroundColor={GAME_HEADER_BACKGROUND}
      videoBackground
    >
      <View style={styles.shell}>
        <View style={styles.content}>{children}</View>
        <View style={styles.footer}>
          {actions ? <View style={styles.actions}>{actions}</View> : null}
          <WordKeyboard {...keyboard} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    gap: tokens.space.sm,
  },
  content: {
    flex: 1,
    minHeight: 0,
    paddingTop: tokens.space.md,
  },
  footer: {
    gap: tokens.space.sm,
    marginHorizontal: -tokens.space.sm,
    paddingHorizontal: tokens.space.xs,
  },
  actions: {
    alignItems: "center",
    flexWrap: "wrap",
    flexDirection: "row",
    justifyContent: "center",
    gap: tokens.space.sm,
  },
});
