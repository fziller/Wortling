import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { tokens } from "@/design/tokens";

export function KeyboardDock({ children }: PropsWithChildren) {
  return <View style={styles.dock}>{children}</View>;
}

const styles = StyleSheet.create({
  dock: {
    gap: tokens.space.sm,
    marginTop: "auto"
  }
});
