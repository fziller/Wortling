import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { tokens } from "@/design/tokens";

export function KeyboardDock({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();

  return <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, tokens.space.md) }]}>{children}</View>;
}

const styles = StyleSheet.create({
  dock: {
    gap: tokens.space.sm
  }
});
