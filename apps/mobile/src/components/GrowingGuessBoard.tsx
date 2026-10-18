import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { BOARD_PADDING_TOP } from "@/games/boardFit";

type GrowingGuessBoardProps = {
  children: ReactNode;
  /** Attempts the game allows. The board also renders an input row on top while playing. */
  maxRows: number;
  rowGap: number;
  rowMinHeight: number;
  style?: StyleProp<ViewStyle>;
};

export function GrowingGuessBoard({ children, maxRows, rowGap, rowMinHeight, style }: GrowingGuessBoardProps) {
  // Reserve the input row as well: reserving only `maxRows` pushed the last row of every
  // game under the footer, where it could be seen but not tapped.
  const reservedRows = Math.max(maxRows + 1, 1);
  const minHeight = BOARD_PADDING_TOP + reservedRows * rowMinHeight + (reservedRows - 1) * rowGap;

  return <View style={[styles.board, { gap: rowGap, minHeight }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  board: {
    justifyContent: "flex-start",
    paddingTop: BOARD_PADDING_TOP,
  },
});