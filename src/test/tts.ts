import { spawnSync } from "child_process";
import { rename } from "fs/promises";
import { file } from "tmp-promise";
import { tts } from "../aliyun/tts";

if (require.main === module) {
  (async () => {
    if (process.argv[2] === undefined) {
      return;
    }
    require("../init");
    const output = await file();
    await tts(
      process.argv[2],
      output.path,
      process.env.TESTING_ALIYUN_NLS_ACCESS_TOKEN!
    );
    console.log(output.path);
    const wavFile = `${output.path}.wav`;
    await rename(output.path, wavFile);
    // afplay for macOS
    // spawnSync("afplay", [wavFile]);
    // aplay for Raspberry
    spawnSync("aplay", [wavFile]);
  })();
}
