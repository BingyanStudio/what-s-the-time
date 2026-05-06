/**
 * 副作用执行器
 *
 * 响应状态变化自动执行副作用（打字动画、聚焦等）。
 */

import { nextTick, watchEffect } from "vue";
import { INPUT_FOCUS_DELAY } from "@/constants";
import type { SideEffect } from "@/types";
import { stateStore } from "./state-store";

class SideEffectExecutor {
  private initialized = false;

  init(): void {
    if (this.initialized) return;

    watchEffect(() => {
      const effects = stateStore.displayState.pendingSideEffects;
      if (effects.length > 0) {
        nextTick(() => {
          for (const effect of effects) {
            this.execute(effect);
          }
          stateStore.updateDisplayState({ pendingSideEffects: [] });
        });
      }
    });

    this.initialized = true;
  }

  private execute(effect: SideEffect): void {
    const delay = effect.delay || 0;

    if (delay > 0) {
      setTimeout(() => this.executeImmediate(effect), delay);
    } else {
      this.executeImmediate(effect);
    }
  }

  private executeImmediate(effect: SideEffect): void {
    switch (effect.type) {
      case "startTyping":
        this.startTyping(effect.target as number);
        break;
      case "focusInput":
        this.focusInput();
        break;
      case "scrollToLine":
        // 滚动由 GameView 的 watch 处理
        break;
    }
  }

  private startTyping(lineIndex: number): void {
    const { displayState } = stateStore._internal;
    const typingComponent = displayState.typingRefs.get(lineIndex);

    if (typingComponent?.startTyping) {
      typingComponent.startTyping();
    } else {
      // 组件可能还未挂载，延迟重试
      setTimeout(() => {
        const comp = stateStore._internal.displayState.typingRefs.get(lineIndex);
        if (comp?.startTyping) {
          comp.startTyping();
        }
      }, 50);
    }
  }

  private focusInput(): void {
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>(
        ".time-input input, .time-input-char",
      );
      input?.focus();
    }, INPUT_FOCUS_DELAY);
  }
}

export const sideEffectExecutor = new SideEffectExecutor();
