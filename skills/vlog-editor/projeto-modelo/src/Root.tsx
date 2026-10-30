import { Composition } from "remotion";
import { Vlog } from "./Vlog";
import { Reel } from "./Reel";
import { DURACAO } from "./edl";
import { REEL_DURACAO } from "./reel-dados";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Vlog" component={Vlog} durationInFrames={DURACAO} fps={30} width={1920} height={1080} />
      <Composition id="Reel" component={Reel} durationInFrames={REEL_DURACAO} fps={30} width={1080} height={1920} />
    </>
  );
};
