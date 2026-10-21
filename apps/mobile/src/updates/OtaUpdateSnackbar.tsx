import * as Updates from "expo-updates";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeOut, SlideInDown } from "react-native-reanimated";
import { usePostHog } from "posthog-react-native";

import { captureEvent } from "@/analytics/events";
import { tokens } from "@/design/tokens";

const AUTO_DISMISS_MS = 10_000;

type OtaUpdateSnackbarProps = {
  canShow: boolean;
};

export function OtaUpdateSnackbar({ canShow }: OtaUpdateSnackbarProps) {
  const posthog = usePostHog();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!Updates.isEnabled || checkedRef.current) return;

    checkedRef.current = true;
    let cancelled = false;

    async function loadUpdate() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (!update.isAvailable) return;

        await Updates.fetchUpdateAsync();
        if (cancelled) return;

        setVisible(true);
        captureEvent(posthog, "ota_update_available", {});
      } catch {
        // OTA updates are optional; failed checks/downloads must not affect gameplay.
      }
    }

    loadUpdate();
    return () => {
      cancelled = true;
    };
  }, [posthog]);

  useEffect(() => {
    if (!visible) return;

    const timeout = setTimeout(() => {
      setVisible(false);
      captureEvent(posthog, "ota_update_dismissed", {});
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timeout);
  }, [posthog, visible]);

  async function handleRestart() {
    if (restarting) return;

    setRestarting(true);
    captureEvent(posthog, "ota_update_restart_pressed", {});

    try {
      await Updates.reloadAsync();
    } catch {
      setRestarting(false);
    }
  }

  if (!visible || !canShow) return null;

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      entering={SlideInDown.springify().damping(18).stiffness(220)}
      exiting={FadeOut.duration(tokens.motion.quick)}
      style={[styles.container, { paddingBottom: insets.bottom + tokens.space.md }]}
    >
      <View style={styles.icon}>
        <Text style={styles.iconText}>↻</Text>
      </View>
      <Text style={styles.message}>Update bereit. Starte die App neu.</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: restarting }}
        disabled={restarting}
        onPress={handleRestart}
        style={({ pressed }) => [styles.restartButton, pressed && !restarting && styles.restartButtonPressed]}
      >
        <Text style={styles.restartLabel}>{restarting ? "Startet…" : "Neu starten"}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: tokens.space.md,
    bottom: 0,
    left: tokens.space.md,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
    padding: tokens.space.sm,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.ink,
    shadowColor: tokens.shadow.raised.color,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 8,
  },
  icon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.action,
    backgroundColor: tokens.color.primaryLight,
  },
  iconText: {
    color: tokens.color.primaryDark,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 23,
  },
  message: {
    flex: 1,
    color: tokens.text.inverse,
    fontFamily: tokens.font.ui.semibold,
    fontSize: 13,
    lineHeight: 17,
  },
  restartButton: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.space.sm,
    borderRadius: tokens.radius.control,
    backgroundColor: tokens.color.primary,
  },
  restartButtonPressed: {
    backgroundColor: tokens.color.primaryDark,
    transform: [{ scale: 0.97 }],
  },
  restartLabel: {
    color: tokens.text.inverse,
    fontFamily: tokens.font.ui.semibold,
    fontSize: 13,
  },
});
