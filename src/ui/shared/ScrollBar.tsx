import type { PointerEvent as ReactPointerEvent } from "react";
import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/** 滑块最小高度（像素），避免长内容时滑块过短难以拖拽 */
const MIN_THUMB_SIZE = 28;

/** 滚轮按行模式（deltaMode=1）时，每行的近似像素高度 */
const LINE_DELTA_PX = 40;

interface ScrollBarProps {
  /** 被监听的滚动容器 */
  targetRef: RefObject<HTMLElement | null>;
}

/** 滚动条几何信息，驱动滑块位置与百分比显示 */
interface ScrollGeometry {
  /** 当前位置进度 0~1 */
  progress: number;
  /** 滑块高度（像素） */
  thumbHeight: number;
  /** 滑块可移动距离（像素） */
  travel: number;
  /** 容器是否可滚动 */
  scrollable: boolean;
}

/**
 * 覆盖式自定义滚动条：覆盖在滚动容器右缘，跟随容器滚动同步滑块位置，
 * 支持滑块拖拽与轨道点击跳转，并实时展示当前位置百分比。
 */
export function ScrollBar({ targetRef }: ScrollBarProps) {
  const [geometry, setGeometry] = useState<ScrollGeometry | null>(null);
  const [dragging, setDragging] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const grabRatioRef = useRef(0.5);

  /** 读取容器与轨道尺寸，换算滑块几何信息并写入状态 */
  const measure = useCallback(() => {
    const el = targetRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
    const trackHeight = track.clientHeight;
    const contentRatio =
      el.scrollHeight > 0 ? Math.min(1, el.clientHeight / el.scrollHeight) : 1;
    const thumbHeight = Math.max(
      MIN_THUMB_SIZE,
      Math.round(trackHeight * contentRatio),
    );
    setGeometry((prev) => {
      const next: ScrollGeometry = {
        progress: maxScroll > 0 ? el.scrollTop / maxScroll : 0,
        thumbHeight,
        travel: Math.max(0, trackHeight - thumbHeight),
        scrollable: maxScroll > 1,
      };
      if (
        prev &&
        prev.progress === next.progress &&
        prev.thumbHeight === next.thumbHeight &&
        prev.travel === next.travel &&
        prev.scrollable === next.scrollable
      ) {
        return prev;
      }
      return next;
    });
  }, [targetRef]);

  // 同步滚动、容器尺寸与内容变化，均通过 rAF 节流为每帧最多一次测量
  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;
    const schedule = () => {
      if (frameRef.current) return;
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = 0;
        measure();
      });
    };
    el.addEventListener("scroll", schedule, { passive: true });
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(el);
    const mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    schedule();
    return () => {
      el.removeEventListener("scroll", schedule);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    };
  }, [targetRef, measure]);

  /** 将滚动位置对齐到指针处，保持抓取点在滑块内的相对位置不变 */
  const scrollToPointer = (clientY: number) => {
    const el = targetRef.current;
    const track = trackRef.current;
    if (!el || !track || !geometry || geometry.travel <= 0) return;
    const thumbTop =
      clientY -
      track.getBoundingClientRect().top -
      grabRatioRef.current * geometry.thumbHeight;
    const ratio = Math.min(1, Math.max(0, thumbTop / geometry.travel));
    el.scrollTop = ratio * (el.scrollHeight - el.clientHeight);
  };

  /** 按下滑块开始拖拽；按在轨道其他位置则直接跳转 */
  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!geometry?.scrollable) return;
    event.preventDefault();
    rootRef.current?.setPointerCapture(event.pointerId);
    const thumbRect = thumbRef.current?.getBoundingClientRect();
    const grabFromThumb =
      event.target === thumbRef.current &&
      thumbRect !== undefined &&
      thumbRect.height > 0;
    grabRatioRef.current = grabFromThumb
      ? (event.clientY - thumbRect.top) / thumbRect.height
      : 0.5;
    setDragging(true);
    if (!grabFromThumb) scrollToPointer(event.clientY);
  };

  /** 结束拖拽并释放指针捕获 */
  const finishDragging = (pointerId: number) => {
    const root = rootRef.current;
    if (root?.hasPointerCapture(pointerId)) {
      root.releasePointerCapture(pointerId);
    }
    setDragging(false);
  };

  const thumbOffset = geometry ? geometry.travel * geometry.progress : 0;
  const percent = geometry ? Math.round(geometry.progress * 100) : 0;

  return (
    <div
      ref={rootRef}
      className={`scroll-bar${dragging ? " scroll-bar-dragging" : ""}`}
      data-hidden={!geometry?.scrollable ? "" : undefined}
      aria-hidden="true"
      onPointerDown={handlePointerDown}
      onPointerMove={(event) => {
        if (dragging) scrollToPointer(event.clientY);
      }}
      onPointerUp={(event) => {
        if (dragging) finishDragging(event.pointerId);
      }}
      onPointerCancel={(event) => {
        if (dragging) finishDragging(event.pointerId);
      }}
      onWheel={(event) => {
        targetRef.current?.scrollBy({
          top:
            event.deltaMode === 1 ? event.deltaY * LINE_DELTA_PX : event.deltaY,
        });
      }}
    >
      <div ref={trackRef} className="scroll-bar-track" />
      <div
        ref={thumbRef}
        className="scroll-bar-thumb"
        style={{
          height: geometry ? `${geometry.thumbHeight}px` : undefined,
          transform: `translateY(${thumbOffset}px)`,
        }}
      />
      <span
        className="scroll-bar-percent"
        style={{ top: thumbOffset + (geometry?.thumbHeight ?? 0) / 2 }}
      >
        {percent}%
      </span>
    </div>
  );
}
