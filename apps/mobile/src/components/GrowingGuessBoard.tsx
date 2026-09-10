import { ReactNode } from "react";
import { StyleProp, StyleSheet, useWindowDimensions, View, ViewStyle } from "react-native";

import { tokens } from "@/design/tokens";

type GrowingGuessBoardProps = {
  children: ReactNode;
  compactRows?: number;
  maxRows: number;
  rowGap: number;
  rowMinHeight: number;
  style?: StyleProp<ViewStyle>;
};

export function GrowingGuessBoard({ children, compactRows, maxRows, rowGap, rowMinHeight, style }: GrowingGuessBoardProps) {
  const { height } = useWindowDimensions();
  const rows = height < 720 && compactRows ? Math.min(maxRows, compactRows) : maxRows;
  const minHeight = rows * rowMinHeight + Math.max(0, rows - 1) * rowGap;

  return <View style={[styles.board, { gap: rowGap, minHeight }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  board: {
    justifyContent: "flex-start",
    paddingTop: tokens.space.xs,
  },
});
