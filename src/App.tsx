import { Agentation } from "agentation";
import { GameView } from "@/ui/game/GameView";

/** 应用根组件；Agentation 仅在 Vite 开发模式启用。 */
export default function App() {
  return (
    <>
      <GameView />
      {import.meta.env.DEV && <Agentation />}
    </>
  );
}
