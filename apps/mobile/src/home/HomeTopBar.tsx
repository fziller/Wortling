import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { tokens } from "@/design/tokens";

export const HOME_HEADER_BACKGROUND = "#FDFBF7";

export function HomeTopBar() {
  return (
    <View style={styles.topBar}>
      <Link href="/stats" asChild>
        <Pressable accessibilityLabel="Statistiken öffnen" accessibilityRole="button" style={styles.iconButton}>
          <Text style={styles.statsIcon}>📊</Text>
        </Pressable>
      </Link>
      <Text style={styles.logo}>WORTKNIFF</Text>
      <Link href="/settings" asChild>
        <Pressable accessibilityLabel="Einstellungen öffnen" accessibilityRole="button" style={styles.iconButton}>
          <Text style={styles.settingsIcon}>⚙</Text>
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
    paddingHorizontal: tokens.space.lg,
    paddingVertical: 14,
  },
  iconButton: {
    alignItems: "center",
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  settingsIcon: {
    color: "#5F6368",
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 25,
  },
  statsIcon: {
    fontSize: 20,
    textAlign: "center",
  },
  logo: {
    color: "#E65100",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -1,
  },
});
