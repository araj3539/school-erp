import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    let receivedChange = false;
    const handleChange = (enabled: boolean) => {
      receivedChange = true;
      if (mounted) setReducedMotion(enabled);
    };

    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", handleChange);
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted && !receivedChange) setReducedMotion(enabled);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reducedMotion;
}
