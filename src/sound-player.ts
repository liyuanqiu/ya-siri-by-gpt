import spawnAsync from "@expo/spawn-async";
import { last } from "lodash";
import { sep } from "path";
import { logger } from "./log";
import { formatError } from "./util";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const logIdentifier = last(__filename.split(sep))!;

export function createSoundPlayer() {
  let current: spawnAsync.SpawnPromise<spawnAsync.SpawnResult> | null = null;
  function stop() {
    if (current !== null) {
      current.child.kill();
    }
  }
  return {
    play: async (soundFile: string) => {
      stop();
      current = spawnAsync(process.env.OS_WAV_PLAYER!, [soundFile]);
      try {
        await current;
      } catch (e) {
        logger.error(`${logIdentifier} Play sound error: ${formatError(e)}`);
      } finally {
        current = null;
      }
    },
    stop,
  };
}
