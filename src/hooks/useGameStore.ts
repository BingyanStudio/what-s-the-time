import { useSyncExternalStore } from "react";
import { stateStore } from "@/engine";

/** 将框架无关的游戏仓库连接到 React。 */
export function useGameStore() {
  return useSyncExternalStore(
    stateStore.subscribe,
    stateStore.getSnapshot,
    stateStore.getSnapshot,
  );
}
