import { spawnSync } from "child_process";
import { join } from "path";

spawnSync("aplay", [join(__dirname, "..", "sound", "ask-me.wav")]);
