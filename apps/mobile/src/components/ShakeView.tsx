import { ReactNode, useEffect } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

import { errorHaptic } from "@/haptics";

type ShakeViewProps = {
  children: ReactNode;
  trigger: number;
};

export function ShakeView({ children, trigger }: ShakeViewProps) {
  const shake = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    errorHaptic();
    shake.value = withSequence(withTiming(-8, { duration: 45 }), withTiming(8, { duration: 70 }), withTiming(-6, { duration: 55 }), withTiming(0, { duration: 55 }));
  }, [shake, trigger]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
