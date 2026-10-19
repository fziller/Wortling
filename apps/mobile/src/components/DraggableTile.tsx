import type { ReactNode } from "react";
import { ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

type DraggableTileProps = {
  children: ReactNode;
  disabled?: boolean;
  onDrop: (x: number, y: number) => void;
  style?: ViewStyle;
};

export function DraggableTile({ children, disabled = false, onDrop, style }: DraggableTileProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const dragging = useSharedValue(0);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .minDistance(8)
    .onBegin(() => {
      dragging.value = 1;
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onFinalize((event, success) => {
      translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
      translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
      dragging.value = withSpring(0, { damping: 18, stiffness: 220 });
      if (success) runOnJS(onDrop)(event.absoluteX, event.absoluteY);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    elevation: dragging.value * 8,
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: 1 + dragging.value * 0.06 }],
    zIndex: Math.round(dragging.value * 10),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View accessible={false} style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
