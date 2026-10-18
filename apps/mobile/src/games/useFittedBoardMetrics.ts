import { useCallback, useMemo, useState } from "react";

import { FitBoardMetricsInput, fitBoardMetrics } from "./boardFit";

type UseFittedBoardMetricsInput = Omit<FitBoardMetricsInput, "contentHeight">;

/**
 * Measures the screen's content area and derives board tile metrics that fit into it.
 * Returns the `onContentLayout` handler to hand to `GameScreenFrame`.
 */
export function useFittedBoardMetrics({ maxAttempts, reservedHeight, rowGap, tile }: UseFittedBoardMetricsInput) {
  const [contentHeight, setContentHeight] = useState(0);

  const onContentLayout = useCallback((height: number) => {
    setContentHeight((current) => (Math.abs(current - height) < 0.5 ? current : height));
  }, []);

  const metrics = useMemo(
    () =>
      fitBoardMetrics({
        contentHeight,
        maxAttempts,
        reservedHeight,
        rowGap,
        tile: { minHeight: tile.minHeight, fontSize: tile.fontSize },
      }),
    [contentHeight, maxAttempts, reservedHeight, rowGap, tile.fontSize, tile.minHeight],
  );

  return { onContentLayout, ...metrics };
}