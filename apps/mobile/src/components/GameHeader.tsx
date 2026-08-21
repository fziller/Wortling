import { Pressable, StyleSheet, Text, View } from "react-native";

import { tokens } from "@/design/tokens";

import { HelpButton } from "./HelpModal";

type GameHeaderProps = {
  onBack: () => void;
  onHelp: () => void;
  subtitle: string;
  title: string;
};

export function GameHeader({ onBack, onHelp, subtitle, title }: GameHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityLabel="Zurück" accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>←</Text>
      </Pressable>
      <View style={styles.titleBlock}>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <Text adjustsFontSizeToFit numberOfLines={1} style={styles.title}>{title}</Text>
      </View>
      <HelpButton onPress={onHelp} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.md,
    paddingTop: tokens.space.lg
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.card
  },
  backText: {
    color: tokens.color.ink,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 30
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    alignItems: "center"
  },
  subtitle: {
    color: tokens.color.primaryDark,
    fontSize: tokens.type.small,
    fontWeight: "900"
  },
  title: {
    color: tokens.color.ink,
    fontSize: tokens.type.h1,
    fontWeight: "900"
  }
});
