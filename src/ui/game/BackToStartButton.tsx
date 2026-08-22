/** 在片段完成后回到时间输入起点。 */
export function BackToStartButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="back-to-start">
      <button type="button" onClick={onClick} className="back-button">
        回到开始
      </button>
    </div>
  );
}
