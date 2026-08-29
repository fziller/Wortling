import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
import { useEffect } from "react";

import { tokens } from "@/design/tokens";
import { HINT_MAX_BALANCE, HINT_WINS_PER_HINT } from "@/hints/types";

type Props = {
  balance: number;
  winsSinceLastHint?: number;
  showProgress?: boolean;
};

export function HintIndicator({ balance, winsSinceLastHint = 0, showProgress = true }: Props) {
  return (
    <View style={styles.wrap} accessibilityLabel={`Tipps ${balance} von ${HINT_MAX_BALANCE}`}>
      <Text style={styles.emoji}>💡</Text>
      <View style={styles.dots}>
        {Array.from({ length: HINT_MAX_BALANCE }).map((_, i) => (
          <HintDot key={i} filled={i < balance} />
        ))}
      </View>
      <Text style={styles.count}>{balance}/{HINT_MAX_BALANCE}</Text>
      {showProgress && balance < HINT_MAX_BALANCE ? (
        <View style={styles.progressWrap}>
          {Array.from({ length: HINT_WINS_PER_HINT }).map((_, i) => (
            <ProgressDot key={i} filled={i < winsSinceLastHint} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function HintDot({ filled }: { filled: boolean }) {
  const style = useAnimatedStyle(() => ({
    backgroundColor: withTiming(filled ? tokens.color.warning : "rgba(23,19,13,0.12)", { duration: 200 }),
    transform: [{ scale: withSpring(filled ? 1 : 0.85, { damping: 18, stiffness: 220 }) }],
  }), [filled]);

  return <Animated.View style={[styles.dot, style]} />;
}

function ProgressDot({ filled }: { filled: boolean }) {
  const style = useAnimatedStyle(() => ({
    backgroundColor: withTiming(filled ? tokens.color.success : "rgba(23,19,13,0.1)", { duration: 200 }),
    opacity: withTiming(filled ? 1 : 0.5, { duration: 200 }),
  }), [filled]);
  return <Animated.View style={[styles.progressDot, style]} />;
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: tokens.radius.pill,
    backgroundColor: "rgba(253,251,247,0.72)",
    borderWidth: 1,
    borderColor: "rgba(23,19,13,0.12)",
  },
  emoji: { fontSize: 13 },
  dots: { flexDirection: "row", gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: "rgba(23,19,13,0.08)" },
  count: { color: tokens.color.muted, fontSize: 12, fontWeight: "800" },
  progressWrap: { flexDirection: "row", gap: 3, marginLeft: 2 },
  progressDot: { width: 5, height: 5, borderRadius: 3 },
});
