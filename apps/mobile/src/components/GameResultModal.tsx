import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { tokens } from "@/design/tokens";

export type GameResultStat = {
  label: string;
  value: string | number;
};

type GameResultModalProps = {
  actionLabel?: string;
  message?: string;
  onHome: () => void;
  onNext: () => void;
  solution?: string;
  stats?: readonly GameResultStat[];
  title: string;
  visible: boolean;
};

export function GameResultModal({ actionLabel = "Neues Wort", message, onHome, onNext, solution, stats = [], title, visible }: GameResultModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {solution ? <Text style={styles.solution}>{solution.toLocaleUpperCase("de-DE")}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {stats.length > 0 ? (
            <View style={styles.stats}>
              {stats.map((stat) => (
                <View key={stat.label} style={styles.statTile}>
                  <Text adjustsFontSizeToFit numberOfLines={1} style={styles.statValue}>{stat.value}</Text>
                  <Text adjustsFontSizeToFit numberOfLines={1} style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onHome} style={[styles.button, styles.secondary]}>
              <Text style={styles.secondaryText}>Startseite</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onNext} style={[styles.button, styles.primary]}>
              <Text style={styles.primaryText}>{actionLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: tokens.space.lg,
    backgroundColor: "rgba(23, 19, 13, 0.48)"
  },
  card: {
    gap: tokens.space.sm,
    padding: tokens.space.md,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.card
  },
  title: {
    color: tokens.color.success,
    fontSize: tokens.type.h2,
    fontWeight: "900",
    textAlign: "center"
  },
  solution: {
    color: tokens.color.ink,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center"
  },
  message: {
    color: tokens.color.muted,
    fontSize: tokens.type.body,
    lineHeight: 24,
    textAlign: "center"
  },
  stats: {
    flexDirection: "row",
    gap: tokens.space.xs
  },
  statTile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 94,
    padding: tokens.space.sm,
    borderRadius: tokens.radius.md,
    backgroundColor: "rgba(36, 107, 254, 0.1)"
  },
  statValue: {
    color: tokens.color.ink,
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 30,
    textAlign: "center"
  },
  statLabel: {
    color: tokens.color.muted,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center"
  },
  actions: {
    flexDirection: "row",
    gap: tokens.space.sm,
    marginTop: tokens.space.sm
  },
  button: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.pill
  },
  secondary: {
    borderWidth: 1,
    borderColor: tokens.color.line,
    backgroundColor: "white"
  },
  primary: {
    backgroundColor: tokens.color.primary
  },
  secondaryText: {
    color: tokens.color.ink,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center"
  },
  primaryText: {
    color: "white",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center"
  }
});
