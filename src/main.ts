import { file } from "tmp-promise";
import { stt } from "./aliyun/stt";
import { tts } from "./aliyun/tts";
import { gptTextCompletion } from "./gpt/text-completion";
import "./init";
import { syslog } from "./log";
import { micRecord } from "./mic-record";
import { sleep } from "./util";

(async () => {
  const micFile = await file();
  const answerFile = await file();

  const stopMic = micRecord(micFile.path);

  await sleep(3000);

  stopMic();

  const text = await stt(micFile.path);

  if (text !== undefined) {
    const answer = await gptTextCompletion(text);

    if (answer !== undefined) {
      await tts(answer, answerFile.path);
    }
  }

  micFile.cleanup();

  // TODO: play the file
  syslog(answerFile.path);
  // answerFile.cleanup();
})();
