import { TIME_INPUT_SEPARATOR_INDEX } from "@/constants";

/** 以与输入框一致的五格布局显示时间。 */
export function TimeDisplay({ time }: { time: string }) {
  const chars =
    time.length >= 5
      ? [time[0], time[1], ":", time[3], time[4]]
      : ["", "", ":", "", ""];
  const positions = [
    "hour-tens",
    "hour-ones",
    "separator",
    "minute-tens",
    "minute-ones",
  ];
  return (
    <div className="time-display-wrapper">
      {chars.map((char, index) => (
        <span
          key={positions[index]}
          className={`time-display-char${index === TIME_INPUT_SEPARATOR_INDEX ? " separator" : ""}`}
        >
          {char}
        </span>
      ))}
    </div>
  );
}
