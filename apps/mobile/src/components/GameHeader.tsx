import { Pressable, StyleSheet, Text, View } from "react-native";

import { tokens } from "@/design/tokens";

type GameHeaderTitleProps = {
  subtitle: string;
  title: string;
};

export function GameHeaderTitle({ subtitle, title }: GameHeaderTitleProps) {
  return (
    <View style={styles.titleBlock}>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.title}>{title}</Text>
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
  button: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.card
  },
  buttonText: {
    color: tokens.color.ink,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 30
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
    fontSize: tokens.type.small,
    fontWeight: "900"
  },
  title: {
    color: tokens.color.ink,
    fontSize: tokens.type.h2,
    fontWeight: "900",
    lineHeight: 24
  }
});
