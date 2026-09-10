import { tokens } from "@/design/tokens";
import * as Device from "expo-device";
import { LinearGradient } from "expo-linear-gradient";
import { VideoView, useVideoPlayer } from "expo-video";
import { PropsWithChildren, ReactNode, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const gameBackgroundVideos = [
  require("../../assets/background/game-background_1.mp4"),
  require("../../assets/background/game-background_2.mp4"),
  require("../../assets/background/game-background_3.mp4"),
  require("../../assets/background/game-background_4.mp4"),
];

const useStaticGameBackground = process.env.EXPO_PUBLIC_STORE_SCREENSHOTS === "1" || !Device.isDevice;

type ScreenProps = PropsWithChildren<{
  header?: ReactNode;
  headerBackgroundColor?: string;
  videoBackground?: boolean;
}>;

export function Screen({ children, header, headerBackgroundColor, videoBackground = false }: ScreenProps) {
  if (!header) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {videoBackground ? <GameBackground /> : null}
        <View style={styles.content}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.safeArea}>
      {videoBackground ? <GameBackground /> : null}
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[
          styles.headerSafeArea,
          videoBackground && styles.videoHeaderSafeArea,
          headerBackgroundColor ? { backgroundColor: headerBackgroundColor } : null,
        ]}
      >
        {header}
      </SafeAreaView>
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.contentSafeArea}>
        <View style={styles.content}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

function GameBackground() {
  return (
    <>
      <StaticGameBackground />
      {useStaticGameBackground ? null : <BackgroundVideo />}
    </>
  );
}

function StaticGameBackground() {
  return (
    <LinearGradient
      colors={[tokens.color.primaryLight, tokens.color.paper, tokens.surface.subdued]}
      locations={[0, 0.48, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    >
      <View style={[styles.backgroundBlob, styles.backgroundBlobPrimary]} />
      <View style={[styles.backgroundBlob, styles.backgroundBlobSecondary]} />
    </LinearGradient>
  );
}

function BackgroundVideo() {
  const source = useMemo(
    () =>
      gameBackgroundVideos[
        Math.floor(Math.random() * gameBackgroundVideos.length)
      ],
    [],
  );
  const player = useVideoPlayer(source, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <VideoView
      contentFit="cover"
      nativeControls={false}
      player={player}
      style={StyleSheet.absoluteFill}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.color.paper,
    overflow: "hidden",
  },
  headerSafeArea: {
    zIndex: 1,
    backgroundColor: tokens.color.paper,
  },
  videoHeaderSafeArea: {
    backgroundColor: tokens.surface.control,
  },
  contentSafeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: tokens.space.md,
    paddingBottom: 8,
    gap: tokens.space.lg,
  },
  backgroundBlob: {
    position: "absolute",
    borderRadius: 999,
    opacity: 1,
  },
  backgroundBlobPrimary: {
    top: -90,
    left: -70,
    width: 230,
    height: 230,
    backgroundColor: tokens.decoration.warmBlob,
  },
  backgroundBlobSecondary: {
    right: -80,
    bottom: 170,
    width: 220,
    height: 220,
    backgroundColor: tokens.decoration.creamBlob,
  },
});
