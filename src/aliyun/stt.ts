// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import nls from "alibabacloud-nls";
import { createReadStream } from "fs";
import { syslog } from "../log";
import { sleep } from "../util";
import { createAliyunAccessTokenService } from "./access-token-service";

interface AliyunNLSSTTReceivedData {
  payload: { result: string; duration: number };
}

export async function stt(inputFile: string) {
  const aliyunNLSTokenService = createAliyunAccessTokenService(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    process.env.ALIYUN_NLS_TOKEN_ENDPOINT!
  );

  const token = await aliyunNLSTokenService.getToken();

  if (token === null) {
    syslog("Get NLS app access token failed!");
    return;
  }

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
        token: token.Id,
      });

      stt.on("started", (msg: unknown) => {
        syslog(`STT Client received started: ${msg}`);
      });

      stt.on("completed", (msg: string) => {
        syslog(`STT Client received completed: ${msg}`);
        resolve((JSON.parse(msg) as AliyunNLSSTTReceivedData).payload.result);
      });

      stt.on("closed", () => {
        syslog("STT Client received closed.");
      });

      stt.on("failed", (msg: unknown) => {
        syslog(`STT Client received failed: ${msg}`);
      });

      try {
        await stt.start(stt.defaultStartParams(), true, 6000);
      } catch (error) {
        syslog(`Error on start STT: ${error}`);
        reject(`${error}`);
        return;
      }

      for (const chunk of audioChunks) {
        if (!stt.sendAudio(chunk)) {
          reject("Send audio failed!");
          return;
        }
        await sleep(20);
      }

      try {
        await stt.close();
        syslog("STT Client closed.");
      } catch (error) {
        syslog(`Error on close STT Client: ${error}`);
      }
    });
  });
}
