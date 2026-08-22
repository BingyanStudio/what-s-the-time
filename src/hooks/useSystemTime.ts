import { useEffect, useState } from "react";

/** 获取本地系统时间（HH:MM）。 */
export const getCurrentSystemTime = (): string => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
};

/** 在分钟边界更新的系统时间 Hook。 */
export function useSystemTime(): string {
  const [systemTime, setSystemTime] = useState(getCurrentSystemTime);

  useEffect(() => {
    let interval: number | undefined;
    const now = new Date();
    const delay = 60_000 - (now.getSeconds() * 1_000 + now.getMilliseconds());
    const timeout = window.setTimeout(() => {
      setSystemTime(getCurrentSystemTime());
      interval = window.setInterval(
        () => setSystemTime(getCurrentSystemTime()),
        60_000,
      );
    }, delay);
    return () => {
      window.clearTimeout(timeout);
      if (interval) window.clearInterval(interval);
    };
  }, []);

  return systemTime;
}
