import watchImage from "@/img/watch.png";

/** 游戏顶部的手表画面与当前输入时间。 */
export function WatchDisplay({ displayTime }: { displayTime?: string }) {
  return (
    <div className="watch-container">
      <img src={watchImage} alt="手表" className="watch-image" />
      {displayTime && <div className="watch-time-display">{displayTime}</div>}
    </div>
  );
}
