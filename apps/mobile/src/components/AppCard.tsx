import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { tokens } from "@/design/tokens";

export function AppCard({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    padding: tokens.space.lg,
    borderWidth: 1,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.card,
    shadowColor: tokens.color.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3
  }
});
