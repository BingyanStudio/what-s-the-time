/**
 * 状态管理 Store
 *
 * 单一数据源，管理游戏状态和显示状态。
 */

import { reactive, readonly } from "vue";
import type { DisplayState, GameState, LineStatus } from "@/types";

class StateStore {
  private _gameState = reactive<GameState>({
    currentLoop: "A",
    unlockedFlags: new Set<string>(),
    viewedSegments: new Set<string>(),
    currentTime: undefined,
    choiceHistory: [],
  });

  private _displayState = reactive<DisplayState>({
    currentSegment: null,
    currentLineIndex: 0,
    displayedLines: [],
    typingRefs: new Map(),
    pendingSideEffects: [],
  });

  private _lineStates = reactive<Map<string, LineStatus>>(new Map());

  // 只读访问
  get gameState(): Readonly<GameState> {
    return readonly(this._gameState) as Readonly<GameState>;
  }

  get displayState(): Readonly<DisplayState> {
    return readonly(this._displayState) as Readonly<DisplayState>;
  }

  get lineStates(): Readonly<Map<string, LineStatus>> {
    return readonly(this._lineStates) as Readonly<Map<string, LineStatus>>;
  }

  // 内部可写访问（供 engine 层使用）
  get _internal(): {
    gameState: GameState;
    displayState: DisplayState;
    lineStates: Map<string, LineStatus>;
  } {
    return {
      gameState: this._gameState,
      displayState: this._displayState,
      lineStates: this._lineStates,
    };
  }

  updateGameState(updates: Partial<GameState>): void {
    Object.assign(this._gameState, updates);
  }

  updateDisplayState(updates: Partial<DisplayState>): void {
    Object.assign(this._displayState, updates);
  }

  updateLineState(lineId: string, status: LineStatus): void {
    this._lineStates.set(lineId, status);
  }

  updateLineStates(updates: Map<string, LineStatus>): void {
    for (const [id, status] of updates) {
      this._lineStates.set(id, status);
    }
  }

  batchUpdate(updates: {
    gameState?: Partial<GameState>;
    displayState?: Partial<DisplayState>;
    lineStates?: Map<string, LineStatus>;
  }): void {
    if (updates.gameState) this.updateGameState(updates.gameState);
    if (updates.displayState) this.updateDisplayState(updates.displayState);
    if (updates.lineStates) this.updateLineStates(updates.lineStates);
  }

  reset(): void {
    Object.assign(this._gameState, {
      currentLoop: "A",
      unlockedFlags: new Set<string>(),
      viewedSegments: new Set<string>(),
      currentTime: undefined,
      choiceHistory: [],
    });
    Object.assign(this._displayState, {
      currentSegment: null,
      currentLineIndex: 0,
      displayedLines: [],
      typingRefs: new Map(),
      pendingSideEffects: [],
    });
    this._lineStates.clear();
  }
}

export const stateStore = new StateStore();
