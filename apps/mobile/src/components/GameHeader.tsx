import { Pressable, StyleSheet, Text, View } from "react-native";

import { tokens } from "@/design/tokens";

type GameScreenHeaderProps = {
  backAccessibilityLabel?: string;
  backLabel?: string;
  helpAccessibilityLabel?: string;
  helpLabel?: string;
  onBack: () => void;
  onHelp: () => void;
  progressLabel?: string;
  subtitle?: string;
  title: string;
};

export function GameScreenHeader({
  backAccessibilityLabel = "Zurück",
  backLabel = "←",
  helpAccessibilityLabel = "Hilfe öffnen",
  helpLabel = "?",
  onBack,
  onHelp,
  progressLabel,
  subtitle,
  title,
}: GameScreenHeaderProps) {
  return (
    <View style={styles.screenHeader}>
      <GameHeaderButton accessibilityLabel={backAccessibilityLabel} label={backLabel} onPress={onBack} />
      <GameHeaderTitle progressLabel={progressLabel} subtitle={subtitle} title={title} />
      <GameHeaderButton accessibilityLabel={helpAccessibilityLabel} label={helpLabel} onPress={onHelp} />
    </View>
  );
}

type GameHeaderTitleProps = {
  progressLabel?: string;
  subtitle?: string;
  title: string;
};

export function GameHeaderTitle({ progressLabel, subtitle, title }: GameHeaderTitleProps) {
  return (
    <View style={styles.titleBlock}>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.title}>{title}</Text>
      {progressLabel ? <Text style={styles.progress}>{progressLabel}</Text> : null}
    </View>
  );
}

type GameHeaderButtonProps = {
  accessibilityLabel: string;
  label: string;
  onPress: () => void;
};

export function GameHeaderButton({ accessibilityLabel, label, onPress }: GameHeaderButtonProps) {
  return (
    <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" onPress={onPress} style={styles.button}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

type GameHeaderHelpButtonProps = {
  onPress: () => void;
};

export function GameHeaderHelpButton({ onPress }: GameHeaderHelpButtonProps) {
  return (
    <View style={styles.helpWrap}>
      <GameHeaderButton accessibilityLabel="Hilfe öffnen" label="?" onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  screenHeader: {
    minHeight: 62,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(238, 231, 221, 0.72)",
    backgroundColor: "transparent",
  },
  button: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: tokens.border.controlSubtle,
    borderRadius: tokens.radius.md,
    backgroundColor: "rgba(255, 253, 248, 0.7)",
  },
  buttonText: {
    color: tokens.color.ink,
    fontSize: 24,
    fontFamily: tokens.font.ui.semibold,
    lineHeight: 28,
  },
  helpWrap: {
    alignItems: "flex-end"
  },
  titleBlock: {
    minWidth: 150,
    maxWidth: 220,
    alignItems: "center",
    justifyContent: "center"
  },
  subtitle: {
    color: tokens.color.primaryDark,
    ...tokens.typography.uiLabel,
  },
  title: {
    color: tokens.color.ink,
    fontSize: tokens.type.h2,
    ...tokens.typography.brand,
    lineHeight: 32,
    paddingTop: 2,
  },
  progress: {
    color: tokens.color.primaryDark,
    ...tokens.typography.uiLabel,
  }
});
