import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  LinearTransition,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming
} from "react-native-reanimated";

import { AppButton } from "@/components/AppButton";
import { Screen } from "@/components/Screen";
import { tokens } from "@/design/tokens";
import { createDailyBetweenGame } from "@/games/between/daily";
import { submitGuess } from "@/games/between/engine";
import { BetweenState } from "@/games/between/types";

const dailyGame = createDailyBetweenGame();

export default function BetweenScreen() {
  const [state, setState] = useState<BetweenState>(dailyGame.state);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("Rate ein deutsches Wort mit 5 Buchstaben.");
  const shake = useSharedValue(0);
  const winGlow = useSharedValue(0);

  const sortedGuesses = useMemo(() => {
    return [...state.guesses].reverse();
  }, [state.guesses]);

  useEffect(() => {
    if (state.status === "won") {
      winGlow.value = withSequence(
        withTiming(1, { duration: tokens.motion.normal }),
        withSpring(0.35, { damping: 8, stiffness: 90 })
      );
    }
  }, [state.status, winGlow]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }]
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.12 + winGlow.value * 0.28,
    transform: [{ scale: 1 + winGlow.value * 0.025 }]
  }));

  function fail(reason: string) {
    setMessage(reason);
    shake.value = withSequence(
      withTiming(-10, { duration: 45 }),
      withTiming(10, { duration: 70 }),
      withTiming(-6, { duration: 55 }),
      withTiming(0, { duration: 55 })
    );
  }

  function guess() {
    const result = submitGuess(state, input);

    if (!result.ok) {
      fail(result.reason);
      return;
    }

    setState(result.state);
    setInput("");

    if (result.guess.direction === "hit") {
      setMessage(`Treffer. ${result.guess.word.toUpperCase()} war das Wort.`);
    } else if (result.guess.direction === "after") {
      setMessage(`Das Ziel liegt nach ${result.guess.word.toUpperCase()}.`);
    } else {
      setMessage(`Das Ziel liegt vor ${result.guess.word.toUpperCase()}.`);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <Animated.View entering={FadeInUp.duration(tokens.motion.normal)} style={styles.header}>
          <Text style={styles.date}>{dailyGame.dateKey}</Text>
          <Text style={styles.title}>Dazwischen</Text>
          <Text style={styles.rules}>Finde das Zielwort. Jeder Tipp sagt dir, ob es alphabetisch davor oder danach liegt.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80)} layout={LinearTransition.springify()} style={[styles.rangeCard, glowStyle]}>
          <View style={styles.boundRow}>
            <Text style={styles.boundLabel}>nach</Text>
            <Text style={styles.boundWord}>{state.lowerBound}</Text>
          </View>
          <View style={styles.track}>
            <View style={styles.trackDot} />
            <View style={styles.trackLine} />
            <View style={[styles.trackDot, styles.trackDotEnd]} />
          </View>
          <View style={styles.boundRow}>
            <Text style={styles.boundLabel}>vor</Text>
            <Text style={styles.boundWord}>{state.upperBound}</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.inputCard, shakeStyle]}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            editable={state.status === "playing"}
            maxLength={5}
            onChangeText={setInput}
            onSubmitEditing={guess}
            placeholder="wort"
            placeholderTextColor="#B09E8B"
            returnKeyType="done"
            style={styles.input}
            value={input}
          />
          <AppButton disabled={input.length < 5 || state.status !== "playing"} label="Tippen" onPress={guess} />
        </Animated.View>

        <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text>

        <View style={styles.history}>
          {sortedGuesses.map((item) => (
            <Animated.View entering={SlideInRight.springify().damping(14)} key={item.word} layout={LinearTransition.springify()} style={styles.guessRow}>
              <Text style={styles.guessWord}>{item.word}</Text>
              <Text style={[styles.guessHint, item.direction === "hit" && styles.hit]}>
                {item.direction === "hit" ? "Treffer" : item.direction === "after" ? "Ziel danach" : "Ziel davor"}
              </Text>
            </Animated.View>
          ))}
        </View>

        {state.status === "won" ? (
          <Pressable accessibilityRole="button" onPress={() => setState(createDailyBetweenGame().state)} style={styles.reset}>
            <Text style={styles.resetText}>Nochmal testen</Text>
          </Pressable>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    gap: tokens.space.lg
  },
  header: {
    gap: tokens.space.sm
  },
  date: {
    color: tokens.color.primaryDark,
    fontSize: tokens.type.small,
    fontWeight: "900",
    letterSpacing: 1.2
  },
  title: {
    color: tokens.color.ink,
    fontSize: tokens.type.h1,
    fontWeight: "900"
  },
  rules: {
    color: tokens.color.muted,
    fontSize: tokens.type.body,
    lineHeight: 24
  },
  rangeCard: {
    gap: tokens.space.md,
    padding: tokens.space.lg,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.card,
    shadowColor: tokens.color.primary,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4
  },
  boundRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between"
  },
  boundLabel: {
    color: tokens.color.muted,
    fontSize: tokens.type.small,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  boundWord: {
    color: tokens.color.ink,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 2
  },
  track: {
    flexDirection: "row",
    alignItems: "center"
  },
  trackDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: tokens.color.secondary
  },
  trackDotEnd: {
    backgroundColor: tokens.color.primary
  },
  trackLine: {
    flex: 1,
    height: 10,
    borderRadius: tokens.radius.pill,
    backgroundColor: "#D9E3FF"
  },
  inputCard: {
    gap: tokens.space.md
  },
  input: {
    height: 70,
    borderWidth: 2,
    borderColor: tokens.color.line,
    borderRadius: tokens.radius.md,
    backgroundColor: "white",
    color: tokens.color.ink,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 8,
    textAlign: "center"
  },
  message: {
    minHeight: 46,
    color: tokens.color.ink,
    fontSize: tokens.type.body,
    fontWeight: "800",
    lineHeight: 23
  },
  history: {
    gap: tokens.space.sm
  },
  guessRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: tokens.space.md,
    borderRadius: tokens.radius.md,
    backgroundColor: "rgba(255, 255, 255, 0.62)"
  },
  guessWord: {
    color: tokens.color.ink,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1.5
  },
  guessHint: {
    color: tokens.color.secondary,
    fontWeight: "900"
  },
  hit: {
    color: tokens.color.success
  },
  reset: {
    alignItems: "center",
    marginTop: "auto",
    padding: tokens.space.md
  },
  resetText: {
    color: tokens.color.primaryDark,
    fontWeight: "900"
  }
});
