import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { tokens } from "@/design/tokens";

export function AppCard({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    padding: tokens.space.lg,
    borderRadius: tokens.radius.surface,
    backgroundColor: tokens.surface.card,
    shadowColor: tokens.shadow.raised.color,
    shadowOpacity: tokens.shadow.raised.opacity,
    shadowRadius: tokens.shadow.raised.radius,
    shadowOffset: tokens.shadow.raised.offset,
    elevation: tokens.shadow.raised.elevation
  }
});
