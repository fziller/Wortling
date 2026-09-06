import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";

import { tokens } from "@/design/tokens";
import type { NewsConfig } from "@/news/current";

type NewsModalProps = {
  news: NewsConfig;
  onClose: () => void;
  visible: boolean;
};

export function NewsModal({ news, onClose, visible }: NewsModalProps) {
  return (
    <Modal animationType="none" transparent visible={visible}>
      <Animated.View entering={FadeIn.duration(tokens.motion.quick)} exiting={FadeOut.duration(tokens.motion.quick)} style={styles.backdrop}>
        <Animated.View entering={ZoomIn.springify().damping(18).stiffness(220)} style={styles.card}>
          <Text style={styles.kicker}>Update</Text>
          <Text style={styles.title}>{news.title}</Text>
          <Text style={styles.body}>{news.body}</Text>
          <View style={styles.list}>
            {news.bullets.map((item) => <Text key={item} style={styles.item}>• {item}</Text>)}
          </View>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.primary}>
            <Text style={styles.primaryText}>Alles klar</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: tokens.space.lg,
    backgroundColor: "rgba(23, 19, 13, 0.56)",
  },
  card: {
    gap: tokens.space.md,
    padding: tokens.space.lg,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.62)",
    backgroundColor: tokens.color.card,
  },
  kicker: {
    alignSelf: "flex-start",
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 5,
    borderRadius: tokens.radius.pill,
    backgroundColor: "rgba(36, 107, 254, 0.1)",
    color: tokens.color.secondary,
    fontSize: tokens.type.small,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: tokens.color.ink,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1.2,
  },
  body: {
    color: tokens.color.muted,
    fontSize: tokens.type.body,
    fontWeight: "700",
    lineHeight: 24,
  },
  list: {
    gap: tokens.space.xs,
    padding: tokens.space.md,
    borderRadius: tokens.radius.md,
    backgroundColor: "rgba(255,255,255,0.62)",
  },
  item: {
    color: tokens.color.ink,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
  },
  primary: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.primary,
  },
  primaryText: {
    color: "white",
    fontSize: tokens.type.body,
    fontWeight: "900",
  },
});
