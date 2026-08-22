/**
 * 执行引擎声明的 UI 副作用。
 *
 * 订阅框架无关的状态仓库，并在 React 提交 DOM 后启动动画或聚焦。
 */
import { INPUT_FOCUS_DELAY } from "@/constants";
import type { SideEffect } from "@/types";
import { stateStore } from "./state-store";

class SideEffectExecutor {
  private initialized = false;
  private processing = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    stateStore.subscribe(() => this.flush());
    this.flush();
  }

  private flush(): void {
    const effects = stateStore.displayState.pendingSideEffects;
    if (this.processing || effects.length === 0) return;
    this.processing = true;
    stateStore.updateDisplayState({ pendingSideEffects: [] });
    requestAnimationFrame(() => {
      for (const effect of effects) this.execute(effect);
      this.processing = false;
      this.flush();
    });
  }

  private execute(effect: SideEffect): void {
    const run = () => this.executeImmediate(effect);
    effect.delay ? window.setTimeout(run, effect.delay) : run();
  }

  private executeImmediate(effect: SideEffect): void {
    if (effect.type === "startTyping") {
      this.startTyping(effect.target as number);
    } else if (effect.type === "focusInput") {
      window.setTimeout(() => {
        document.querySelector<HTMLInputElement>(".time-input-char")?.focus();
      }, INPUT_FOCUS_DELAY);
    }
  }

  private startTyping(lineIndex: number): void {
    const start = () => {
      const component = stateStore.displayState.typingRefs.get(lineIndex);
      component?.startTyping?.();
      return Boolean(component?.startTyping);
    };
    if (!start()) window.setTimeout(start, 50);
  }
}

export const sideEffectExecutor = new SideEffectExecutor();
