import { Link } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { tokens } from "@/design/tokens";

export const HOME_HEADER_BACKGROUND = "#FDFBF7";

export function HomeTopBar({ onHelp }: { onHelp?: () => void }) {
  return (
    <View style={styles.topBar}>
      <Link href="/stats" asChild>
        <Pressable accessibilityLabel="Statistiken öffnen" accessibilityRole="button" style={styles.iconButton}>
          <Feather color={tokens.color.muted} name="bar-chart-2" size={22} />
        </Pressable>
      </Link>
      <Pressable accessibilityLabel="Tageskniffe erklären" accessibilityRole="button" onPress={onHelp} style={styles.logoButton}>
        <Text adjustsFontSizeToFit minimumFontScale={0.82} numberOfLines={1} style={styles.logo}>WORTKNIFF</Text>
        <Text style={styles.helpIcon}>?</Text>
      </Pressable>
      <Link href="/settings" asChild>
        <Pressable accessibilityLabel="Einstellungen öffnen" accessibilityRole="button" style={styles.iconButton}>
          <Feather color={tokens.color.muted} name="settings" size={22} />
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: "center",
    backgroundColor: HOME_HEADER_BACKGROUND,
    borderBottomColor: "#EEE7DD",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -tokens.space.md,
    paddingHorizontal: tokens.space.md,
    paddingVertical: 14,
  },
  iconButton: {
    alignItems: "center",
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  logo: {
    color: "#E65100",
    flexShrink: 1,
    fontSize: 20,
    fontFamily: tokens.font.ui.semibold,
    letterSpacing: -0.6,
  },
  logoButton: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    flexShrink: 1,
    gap: 6,
    justifyContent: "center",
    minWidth: 0,
  },
  helpIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: tokens.color.primaryLight,
    color: tokens.color.primaryDark,
    flexShrink: 0,
    fontSize: 13,
    fontFamily: tokens.font.ui.semibold,
    lineHeight: 20,
    textAlign: "center",
  },
});
