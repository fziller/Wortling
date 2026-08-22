import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { tokens } from "@/design/tokens";
import { GameScreenHeader } from "@/components/GameHeader";
import { KeyboardLetterState, WordKeyboard } from "@/components/WordKeyboard";
import { Screen } from "@/components/Screen";

export const GAME_HEADER_BACKGROUND = "rgba(253, 251, 247, 0.72)";

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
  inputPreview?: ReactNode;
  keyboard: GameKeyboardConfig;
  onBack: () => void;
  onHelp: () => void;
  subtitle: string;
  title: string;
};

export function GameScreenFrame({
  actions,
  children,
  inputPreview,
  keyboard,
  onBack,
  onHelp,
  subtitle,
  title,
}: GameScreenFrameProps) {
  return (
    <Screen
      header={<GameScreenHeader onBack={onBack} onHelp={onHelp} subtitle={subtitle} title={title} />}
      headerBackgroundColor={GAME_HEADER_BACKGROUND}
      videoBackground
    >
      <View style={styles.shell}>
        <View style={styles.content}>{children}</View>
        <View style={styles.footer}>
          {inputPreview ? <View style={styles.inputPreview}>{inputPreview}</View> : null}
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
  },
  inputPreview: {
    gap: tokens.space.sm,
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: tokens.space.sm,
  },
});
