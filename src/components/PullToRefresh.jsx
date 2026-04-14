import { useState, useRef, useEffect } from "react";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const getMainScroll = () => document.querySelector("main") || el;

    const onTouchStart = (e) => {
      const scrollEl = getMainScroll();
      if (scrollEl.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e) => {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      const scrollEl = getMainScroll();
      if (dy > 0 && scrollEl.scrollTop === 0) {
        e.preventDefault();
        setPullDistance(Math.min(dy, THRESHOLD * 1.5));
      }
    };

    const onTouchEnd = async () => {
      if (pullDistance >= THRESHOLD && !refreshing) {
        setRefreshing(true);
        setPullDistance(0);
        await onRefresh();
        setRefreshing(false);
      } else {
        setPullDistance(0);
      }
      startY.current = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [pullDistance, refreshing, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const showIndicator = pullDistance > 0 || refreshing;

  return (
    <div ref={containerRef}>
      {showIndicator && (
        <div
          className="flex items-center justify-center transition-all"
          style={{ height: refreshing ? 48 : pullDistance * 0.6 }}
        >
          <div
            className={`w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shadow ${
              refreshing ? "animate-spin" : ""
            }`}
            style={{ opacity: refreshing ? 1 : progress }}
          >
            <RefreshCw className="w-4 h-4 text-orange-500" />
          </div>
        </div>
      )}
      {children}
    </div>
  );
}