import { useEffect } from "react";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";
import Animated, { interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

import { tokens } from "@/design/tokens";
import type { WorttrefferTileMark } from "@/games/worttreffer/types";

type HintableLetterTileProps = {
  accessibilityLabel: string;
  disabled: boolean;
  letter: string;
  mark?: WorttrefferTileMark;
  minHeight: number;
  onPress: () => void;
  placeholder?: string | null;
  revealDelay?: number;
  revealDuration?: number;
  revealing?: boolean;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  textSize: number;
};

function markColor(mark?: WorttrefferTileMark) {
  if (mark === "correct") return tokens.semantic.correct;
  if (mark === "present") return tokens.semantic.partial;
  if (mark === "absent") return tokens.semantic.eliminated;

  return tokens.surface.input;
}

/** Shared Worttreffer-style input tile. A correct mark is also used for fixed hint letters. */
export function HintableLetterTile({ accessibilityLabel, disabled, letter, mark, minHeight, onPress, placeholder, revealDelay = 0, revealDuration = 240, revealing = false, selected = false, style, textSize }: HintableLetterTileProps) {
  const targetColor = markColor(mark);
  const progress = useSharedValue(mark ? 1 : 0);

  useEffect(() => {
    if (revealing) {
      progress.value = 0;
      progress.value = withDelay(revealDelay, withTiming(1, { duration: revealDuration }));
      return;
    }

    progress.value = mark ? withTiming(1, { duration: tokens.motion.quick }) : withTiming(0, { duration: tokens.motion.quick });
  }, [mark, progress, revealDelay, revealDuration, revealing]);

  const tileStyle = useAnimatedStyle(() => {
    const baseBorder = selected ? tokens.color.primary : tokens.color.line;
    const baseBg = selected ? tokens.color.primaryLight : tokens.surface.input;
    const endBorder = selected ? tokens.color.primary : targetColor;
    const endBg = selected ? tokens.color.primaryLight : targetColor;

    return {
      backgroundColor: interpolateColor(progress.value, [0, 0.5, 1], [baseBg, baseBg, endBg]),
      borderColor: interpolateColor(progress.value, [0, 0.5, 1], [baseBorder, baseBorder, endBorder]),
      transform: [{ scaleY: interpolate(progress.value, [0, 0.5, 1], [1, 0.08, 1]) }],
    };
  });

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 0.5, 1], [tokens.color.ink, tokens.color.ink, mark ? tokens.text.inverse : tokens.color.ink]),
  }));

  return (
    <AnimatedPressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.tile, { minHeight }, style, tileStyle]}>
      <Animated.Text style={[styles.text, { fontSize: textSize }, placeholder && !letter && styles.placeholder, textStyle]}>
        {(letter || placeholder || "").trim().toLocaleUpperCase("de-DE")}
      </Animated.Text>
    </AnimatedPressable>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.surface.input,
  },
  text: { minWidth: 12, color: tokens.color.ink, textAlign: "center", ...tokens.typography.gameLetter },
  placeholder: { color: tokens.color.muted, opacity: 0.45 },
});
