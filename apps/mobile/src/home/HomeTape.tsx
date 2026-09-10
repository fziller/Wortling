import { StyleSheet, View } from "react-native";

import { tokens } from "@/design/tokens";

export type TapePosition = keyof typeof tapePositions;

export function HomeTape({ position }: { position: TapePosition }) {
  return <View style={[styles.tape, tapePositions[position]]} />;
}

const tapePositions = StyleSheet.create({
  topRight: {
    right: 18,
    top: -5,
    transform: [{ rotate: "10deg" }],
  },
  topLeft: {
    left: 34,
    top: -6,
    transform: [{ rotate: "-15deg" }],
  },
  topCenter: {
    left: "43%",
    top: 5,
    transform: [{ rotate: "3deg" }],
  },
  bottomRight: {
    bottom: 10,
    right: 44,
    transform: [{ rotate: "48deg" }],
  },
  bottomLeft: {
    bottom: 18,
    left: 18,
    transform: [{ rotate: "-12deg" }],
  },
  bottomCenter: {
    bottom: -1,
    left: "43%",
    transform: [{ rotate: "-3deg" }],
  },
  dailyTopRight: {
    right: 38,
    top: -6,
    transform: [{ rotate: "10deg" }],
  },
});

const styles = StyleSheet.create({
  tape: {
    backgroundColor: tokens.decoration.tape,
    borderColor: tokens.decoration.tapeBorder,
    borderWidth: 1,
    height: 23,
    opacity: 0.76,
    position: "absolute",
    shadowColor: tokens.color.shadow,
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    width: 82,
    zIndex: 2,
  },
});
