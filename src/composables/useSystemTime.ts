import { ref } from "vue";

/**
 * 全局系统时间状态管理
 * 确保 systemTime 在所有组件实例之间共享
 */
const systemTime = ref<string>("");
let systemTimeTimer: number | null = null;

/**
 * 获取当前系统时间（HH:MM格式）
 */
const getCurrentSystemTime = (): string => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

/**
 * 更新系统时间
 */
const updateSystemTime = () => {
  systemTime.value = getCurrentSystemTime();
};

/**
 * 初始化系统时间（只初始化一次）
 */
const initSystemTime = () => {
  // 如果已经初始化，不重复初始化
  if (systemTimeTimer !== null) {
    return;
  }

  // 初始化系统时间
  updateSystemTime();

  // 设置定时器，每分钟更新一次系统时间（在分钟变化时更新）
  const updateTimer = () => {
    updateSystemTime();
    // 计算到下一分钟的毫秒数
    const now = new Date();
    const msUntilNextMinute =
      60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
    systemTimeTimer = window.setTimeout(() => {
      updateSystemTime();
      // 之后每分钟更新一次
      systemTimeTimer = window.setInterval(updateSystemTime, 60000);
    }, msUntilNextMinute);
  };
  updateTimer();
};

/**
 * 使用系统时间的 Composable
 */
export function useSystemTime() {
  // 确保初始化
  initSystemTime();

  return {
    systemTime,
    getCurrentSystemTime,
    updateSystemTime,
  };
}
