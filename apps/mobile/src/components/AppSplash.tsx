import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOut, ZoomIn } from "react-native-reanimated";

import { tokens } from "@/design/tokens";

const glow = require("../../assets/splash-glow.png");
const guesses = ["K____", "KN___", "KNI__", "KNIFF"];

export function AppSplash() {
  return (
    <Animated.View exiting={FadeOut.duration(tokens.motion.normal)} style={styles.wrap}>
      <Image source={glow} style={styles.glow} />
      <LinearGradient colors={["#FFFDF8", "#FFF1DF"]} style={styles.board}>
        {guesses.map((guess, rowIndex) => (
          <View key={guess} style={styles.row}>
            {guess.split("").map((letter, tileIndex) => {
              const isSolved = rowIndex === guesses.length - 1;
              const isFilled = letter !== "_";
              const delay = rowIndex * 360 + tileIndex * 70;

              return (
                <Animated.View
                  entering={ZoomIn.delay(delay).springify().damping(18).stiffness(220)}
                  key={`${guess}-${tileIndex}`}
                  style={[
                    styles.tile,
                    isFilled ? styles.tileFilled : null,
                    isSolved ? styles.tileSolved : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.tileText,
                      isFilled ? null : styles.tileTextEmpty,
                      isSolved ? styles.tileTextSolved : null,
                    ]}
                  >
                    {letter}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        ))}
      </LinearGradient>
      <Animated.View entering={FadeInDown.delay(1600).duration(tokens.motion.slow)} style={styles.copy}>
        <Text style={styles.title}>Wortkniff</Text>
        <Text style={styles.subtitle}>Deutsche Wörter, clever gerätselt.</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6B2C",
  },
  glow: {
    position: "absolute",
    width: 390,
    height: 390,
    resizeMode: "contain",
  },
  board: {
    width: 278,
    gap: tokens.space.sm,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.lg,
    padding: tokens.space.lg,
    shadowColor: tokens.color.shadow,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 12,
  },
  row: {
    flexDirection: "row",
    gap: tokens.space.xs,
  },
  tile: {
    width: 38,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E8D6BE",
    borderRadius: tokens.radius.sm,
    backgroundColor: "rgba(255, 255, 255, 0.62)",
  },
  tileFilled: {
    borderColor: tokens.color.primary,
    backgroundColor: "#FFF7ED",
  },
  tileSolved: {
    borderColor: "#167A59",
    backgroundColor: tokens.color.success,
  },
  tileText: {
    color: tokens.color.ink,
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  tileTextEmpty: {
    color: tokens.color.muted,
    opacity: 0.45,
  },
  tileTextSolved: {
    color: "white",
  },
  copy: {
    position: "absolute",
    bottom: 82,
    alignItems: "center",
    gap: 4,
    paddingHorizontal: tokens.space.lg,
  },
  title: {
    color: "white",
    fontSize: 46,
    fontWeight: "900",
    letterSpacing: -1.4,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: tokens.type.body,
    fontWeight: "800",
    textAlign: "center",
  },
});
