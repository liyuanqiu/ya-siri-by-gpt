// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import nls from "alibabacloud-nls";
import { createReadStream } from "fs";
import { last } from "lodash";
import { sep } from "path";
import { logger } from "../log";
import { formatError, sleep } from "../util";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const logIdentifier = last(__filename.split(sep))!;

interface AliyunNLSSTTReceivedData {
  payload: { result: string; duration: number };
}

export async function stt(inputFile: string, token: string) {
  const audioStream = createReadStream(inputFile, {
    encoding: "binary",
    highWaterMark: 1024,
  });

  const audioChunks: Buffer[] = [];

  audioStream.on("data", (chunk) => {
    audioChunks.push(
      typeof chunk === "string" ? Buffer.from(chunk, "binary") : chunk
    );
  });

  return new Promise<string>((resolve, reject) => {
    audioStream.on("close", async () => {
      const stt = new nls.SpeechRecognition({
        url: process.env.ALIYUN_NLS_WS,
        appkey: process.env.ALIYUN_NLS_APP_KEY,
        token,
      });

      stt.on("started", (msg: unknown) => {
        logger.debug(`${logIdentifier} stt event_started: ${msg}`);
      });

      stt.on("completed", (msg: string) => {
        logger.debug(`${logIdentifier} stt event_completed: ${msg}`);
        resolve((JSON.parse(msg) as AliyunNLSSTTReceivedData).payload.result);
      });

      stt.on("closed", () => {
        logger.debug(`${logIdentifier} stt event_closed`);
      });

      stt.on("failed", (msg: unknown) => {
        const errStr = `${logIdentifier} stt event_failed: ${msg}`;
        logger.error(errStr);
        reject(errStr);
      });

      try {
        await stt.start(stt.defaultStartParams(), true, 6000);
      } catch (error) {
        const errStr = `${logIdentifier} Failed to start stt: ${formatError(
          error
        )}`;
        logger.error(errStr);
        reject(errStr);
        return;
      }

      for (const chunk of audioChunks) {
        if (!stt.sendAudio(chunk)) {
          const errStr = `${logIdentifier} Failed to send audio.`;
          logger.error(errStr);
          reject(errStr);
          return;
        }
        await sleep(20);
      }

      try {
        await stt.close();
        logger.info(`${logIdentifier} stt closed.`);
      } catch (error) {
        const errStr = `${logIdentifier} Failed to close stt: ${formatError(
          error
        )}`;
        logger.error(errStr);
        reject(errStr);
        return;
      }
    });
  });
}
