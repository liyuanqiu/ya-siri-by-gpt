import { spawnSync } from "child_process";
import { rename } from "fs/promises";
import { last } from "lodash";
import { sep } from "path";
import { file } from "tmp-promise";
import { createAliyunAccessTokenService } from "./aliyun/access-token-service";
import { stt } from "./aliyun/stt";
import { tts } from "./aliyun/tts";
import { gptTextCompletionAzure } from "./gpt/text-completion-azure";
import "./init";
import { logger } from "./log";
import { micRecord } from "./mic-record";
import { sleep } from "./util";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const logIdentifier = last(__filename.split(sep))!;

(async () => {
  const nlsTokenService = createAliyunAccessTokenService(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    process.env.ALIYUN_NLS_TOKEN_ENDPOINT!
  );

  const token = await nlsTokenService.getToken();

  if (token === null) {
    logger.error(`${logIdentifier} Failed to get the aliyun nls access token.`);
    return;
  }

  const micFile = await file();
  const answerFile = await file();

  const stopMic = micRecord(micFile.path);

  await sleep(5000);

  stopMic();

  const text = await stt(micFile.path, token.Id);

  if (text !== undefined) {
    const answer = await gptTextCompletionAzure(text);

    if (answer !== undefined) {
      await tts(answer, answerFile.path, token.Id);
    }
  }

  micFile.cleanup();

  const wavFile = `${answerFile.path}.wav`;
  await rename(answerFile.path, wavFile);
  spawnSync("afplay", [wavFile]);
  answerFile.cleanup();
})();
