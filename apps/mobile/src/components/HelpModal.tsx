import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { HeaderActionButton } from "@/components/AppHeader";
import { tokens } from "@/design/tokens";

type HelpModalProps = {
  title: string;
  paragraphs: readonly string[];
  visible: boolean;
  onClose: () => void;
};

export function HelpButton({ onPress }: { onPress: () => void }) {
  return <HeaderActionButton accessibilityLabel="Hilfe öffnen" icon="help-circle" onPress={onPress} />;
}

export function HelpModal({ title, paragraphs, visible, onClose }: HelpModalProps) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {paragraphs.map((paragraph) => (
            <Text key={paragraph} style={styles.body}>{paragraph}</Text>
          ))}
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Alles klar</Text>
          </Pressable>
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
    backgroundColor: "rgba(23, 19, 13, 0.42)"
  },
  card: {
    gap: tokens.space.md,
    padding: tokens.space.lg,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.surface.raised,
    borderWidth: 1,
    borderColor: tokens.color.line
  },
  title: {
    color: tokens.color.ink,
    fontSize: tokens.type.h1,
    fontFamily: tokens.font.ui.semibold,
  },
  body: {
    color: tokens.color.muted,
    ...tokens.typography.uiBody,
  },
  closeButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: tokens.space.sm,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.primary
  },
  closeText: {
    color: "white",
    ...tokens.typography.uiControl,
    fontFamily: tokens.font.ui.semibold,
  }
});
