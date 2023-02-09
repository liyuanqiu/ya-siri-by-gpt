// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import nls from "alibabacloud-nls";
import { createWriteStream } from "fs";
import { last } from "lodash";
import { sep } from "path";
import { logger } from "../log";
import { formatError } from "../util";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const logIdentifier = last(__filename.split(sep))!;

export async function tts(text: string, outputFile: string, token: string) {
  logger.info(`${logIdentifier} Converting text to speech: "${text}"`);

  const dumpFile = createWriteStream(outputFile, { flags: "w" });

  const tts = new nls.SpeechSynthesizer({
    url: process.env.ALIYUN_NLS_WS,
    appkey: process.env.ALIYUN_NLS_APP_KEY,
    token,
  });

  tts.on("meta", (msg: unknown) => {
    logger.debug(`${logIdentifier} tts event_meta: ${msg}`);
  });

  tts.on("data", (msg: unknown) => {
    dumpFile.write(msg, "binary");
  });

  tts.on("completed", (msg: unknown) => {
    logger.debug(`${logIdentifier} tts event_completed: ${msg}`);
  });

  tts.on("closed", () => {
    logger.debug(`${logIdentifier} tts event_closed.`);
  });

  tts.on("failed", (msg: unknown) => {
    logger.debug(`${logIdentifier} tts event_failed: ${msg}`);
  });

  const param = tts.defaultStartParams();
  param.text = `<speak voice="${process.env.ALIYUN_NLS_VOICE}">
  <emotion category="${process.env.ALIYUN_NLS_EMOTION}" intensity="1.0">${text}</emotion></speak>`;
  param.voice = process.env.ALIYUN_NLS_VOICE;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  param.speech_rate = parseInt(process.env.ALIYUN_NLS_SPEECH_RATE!);
  try {
    await tts.start(param, true, 6000);
  } catch (error) {
    logger.error(`${logIdentifier} Failed to start tts: ${formatError(error)}`);
    return;
  } finally {
    dumpFile.end();
  }
  logger.info(`${logIdentifier} Text to speech done!`);
}
