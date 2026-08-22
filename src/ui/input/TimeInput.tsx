import {
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  INPUT_FOCUS_DELAY,
  TIME_INPUT_FORMAT,
  TIME_INPUT_SEPARATOR_INDEX,
  TIME_SUBMIT_DELAY,
} from "@/constants";
import { useMechanicalSound } from "@/hooks/useMechanicalSound";

interface TimeInputProps {
  disabled?: boolean;
  autoFocus?: boolean;
  onComplete: (time: string) => void;
}

const nextIndex = (index: number) => (index === 1 ? 3 : Math.min(index + 1, 4));
const previousIndex = (index: number) =>
  index === 3 ? 1 : Math.max(index - 1, 0);

/** 四位数字时间输入，支持自动跳格、方向键、退格和粘贴。 */
export function TimeInput({
  disabled = false,
  autoFocus = true,
  onComplete,
}: TimeInputProps) {
  const [chars, setChars] = useState<string[]>([...TIME_INPUT_FORMAT]);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const playSound = useMechanicalSound();
  const positions = [
    "hour-tens",
    "hour-ones",
    "separator",
    "minute-tens",
    "minute-ones",
  ];

  useEffect(() => {
    if (!autoFocus || disabled) return;
    const timer = window.setTimeout(
      () => inputs.current[0]?.focus(),
      INPUT_FOCUS_DELAY,
    );
    return () => window.clearTimeout(timer);
  }, [autoFocus, disabled]);

  const submitIfComplete = (nextChars: string[]) => {
    if (isProcessing) return;
    const time = `${nextChars[0]}${nextChars[1]}:${nextChars[3]}${nextChars[4]}`;
    if (!/^\d{2}:\d{2}$/.test(time)) return;
    setIsProcessing(true);
    window.setTimeout(() => onComplete(time), TIME_SUBMIT_DELAY);
  };

  const updateChar = (event: FormEvent<HTMLInputElement>, index: number) => {
    if (disabled || isProcessing) return;
    const value = event.currentTarget.value.replace(/\D/g, "").slice(-1);
    const updated = [...chars];
    if (updated[index] !== value) playSound();
    updated[index] = value;
    setChars(updated);
    if (value) {
      window.setTimeout(() => inputs.current[nextIndex(index)]?.focus());
      submitIfComplete(updated);
    }
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (disabled || isProcessing) return;
    if (event.key === "Backspace" && !chars[index]) {
      event.preventDefault();
      const previous = previousIndex(index);
      const updated = [...chars];
      if (updated[previous]) playSound();
      updated[previous] = "";
      setChars(updated);
      inputs.current[previous]?.focus();
    } else if (event.key === "ArrowLeft") {
      inputs.current[previousIndex(index)]?.focus();
    } else if (event.key === "ArrowRight") {
      inputs.current[nextIndex(index)]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    if (disabled || isProcessing) return;
    const value = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);
    if (value.length !== 4) return;
    const updated = [value[0], value[1], ":", value[2], value[3]];
    setChars(updated);
    submitIfComplete(updated);
  };

  return (
    <div className="time-input-wrapper">
      {chars.map((char, index) => (
        <input
          key={positions[index]}
          ref={(element) => {
            inputs.current[index] = element;
          }}
          value={char}
          onInput={(event) => updateChar(event, index)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onPaste={handlePaste}
          type="text"
          inputMode="numeric"
          maxLength={1}
          aria-label={index === 2 ? "时间分隔符" : `时间第 ${index + 1} 位`}
          className={`time-input-char${index === 2 ? " separator" : ""}`}
          disabled={
            disabled || isProcessing || index === TIME_INPUT_SEPARATOR_INDEX
          }
          readOnly={index === TIME_INPUT_SEPARATOR_INDEX}
        />
      ))}
    </div>
  );
}
