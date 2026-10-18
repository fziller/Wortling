import { useCallback, type ReactNode } from "react";
import { type LayoutChangeEvent, ScrollView, StyleSheet, View } from "react-native";

import { tokens } from "@/design/tokens";
import { GAME_HEADER_BACKGROUND, GameHeader } from "@/components/AppHeader";
import { KeyboardLetterState, WordKeyboard } from "@/components/WordKeyboard";
import { Screen } from "@/components/Screen";

/** Top inset of the content area. `onContentLayout` reports children height, so it is subtracted there. */
const CONTENT_INSET_TOP = tokens.space.md;

export type GameKeyboardConfig = {
  disabled?: boolean;
  letterStates?: Record<string, KeyboardLetterState>;
  onBackspace: () => void;
  onLetter: (letter: string) => void;
  onSubmit: () => void;
  showBackspace?: boolean;
  showLetters?: boolean;
  showSubmit?: boolean;
  submitDisabled?: boolean;
};

type GameScreenFrameProps = {
  actions?: ReactNode;
  children: ReactNode;
  keyboard?: GameKeyboardConfig;
  /** Wraps the content area in a ScrollView so short screens never bury the last board row. */
  contentScroll?: boolean;
  /** Height the content area has left for its children. Games use it to fit board rows to the space they actually got. */
  onContentLayout?: (height: number) => void;
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
  contentScroll = false,
  onContentLayout,
  onBack,
  onHelp,
  progressLabel,
  subtitle,
  title,
}: GameScreenFrameProps) {
  // Measure the box the parent bounds, never the content itself — inside a ScrollView the
  // content is allowed to outgrow the viewport, and reporting that back would feed
  // `useFittedBoardMetrics` its own overflow and never shrink anything. The top inset is
  // subtracted because `onLayout` reports the border box.
  const measure = useCallback(
    (event: LayoutChangeEvent) => onContentLayout?.(event.nativeEvent.layout.height - CONTENT_INSET_TOP),
    [onContentLayout],
  );

  return (
    <Screen
      header={<GameHeader onBack={onBack} onHelp={onHelp} progressLabel={progressLabel} subtitle={subtitle} title={title} />}
      headerBackgroundColor={GAME_HEADER_BACKGROUND}
      videoBackground
    >
      <View style={styles.shell}>
        {contentScroll ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            onLayout={onContentLayout ? measure : undefined}
            showsVerticalScrollIndicator={false}
            style={styles.contentScroll}
          >
            {children}
          </ScrollView>
        ) : (
          <View onLayout={onContentLayout ? measure : undefined} style={styles.content}>
            {children}
          </View>
        )}
        <View style={styles.footer}>
          {actions ? <View style={styles.actions}>{actions}</View> : null}
          {keyboard ? <WordKeyboard {...keyboard} /> : null}
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
    paddingTop: CONTENT_INSET_TOP,
  },
  contentScroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: CONTENT_INSET_TOP,
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
