/**
 * 游戏状态仓库。
 *
 * 引擎通过不可变快照写入，React 通过 useSyncExternalStore 订阅。
 */
import type { DisplayState, GameState, LineStatus } from "@/types";

export interface GameSnapshot {
  gameState: GameState;
  displayState: DisplayState;
  lineStates: Map<string, LineStatus>;
}

const createSnapshot = (): GameSnapshot => ({
  gameState: {
    currentLoop: "A",
    unlockedFlags: new Set(),
    viewedSegments: new Set(),
    currentTime: undefined,
    choiceHistory: [],
  },
  displayState: {
    currentSegment: null,
    currentLineIndex: 0,
    displayedLines: [],
    typingRefs: new Map(),
    pendingSideEffects: [],
  },
  lineStates: new Map(),
});

class StateStore {
  private snapshot = createSnapshot();
  private listeners = new Set<() => void>();

  get gameState(): Readonly<GameState> {
    return this.snapshot.gameState;
  }

  get displayState(): Readonly<DisplayState> {
    return this.snapshot.displayState;
  }

  get lineStates(): Readonly<Map<string, LineStatus>> {
    return this.snapshot.lineStates;
  }

  get _internal(): GameSnapshot {
    return this.snapshot;
  }

  getSnapshot = (): GameSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private publish(updates: Partial<GameSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...updates };
    for (const listener of this.listeners) listener();
  }

  updateGameState(updates: Partial<GameState>): void {
    this.publish({
      gameState: { ...this.snapshot.gameState, ...updates },
    });
  }

  updateDisplayState(updates: Partial<DisplayState>): void {
    this.publish({
      displayState: { ...this.snapshot.displayState, ...updates },
    });
  }

  updateLineState(lineId: string, status: LineStatus): void {
    const lineStates = new Map(this.snapshot.lineStates);
    lineStates.set(lineId, status);
    const displayedLines = this.snapshot.displayState.displayedLines.map(
      (line) => (line.id === lineId ? { ...line, status } : line),
    );
    this.publish({
      lineStates,
      displayState: { ...this.snapshot.displayState, displayedLines },
    });
  }

  updateLineStates(updates: Map<string, LineStatus>): void {
    const lineStates = new Map(this.snapshot.lineStates);
    for (const [id, status] of updates) lineStates.set(id, status);
    this.publish({ lineStates });
  }

  batchUpdate(updates: Partial<GameSnapshot>): void {
    this.publish({
      gameState: updates.gameState
        ? { ...this.snapshot.gameState, ...updates.gameState }
        : this.snapshot.gameState,
      displayState: updates.displayState
        ? { ...this.snapshot.displayState, ...updates.displayState }
        : this.snapshot.displayState,
      lineStates: updates.lineStates
        ? new Map(updates.lineStates)
        : this.snapshot.lineStates,
    });
  }

  reset(): void {
    this.snapshot = createSnapshot();
    for (const listener of this.listeners) listener();
  }
}

export const stateStore = new StateStore();
