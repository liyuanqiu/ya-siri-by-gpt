// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import nls from "alibabacloud-nls";
import { createWriteStream } from "fs";
import { syslog } from "../log";
import { createAliyunAccessTokenService } from "./access-token-service";

export async function tts(text: string, outputFile: string) {
  syslog(`speak: ${text}`);

  const aliyunNLSTokenService = createAliyunAccessTokenService(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    process.env.ALIYUN_NLS_TOKEN_ENDPOINT!
  );

  const token = await aliyunNLSTokenService.getToken();

  if (token === null) {
    syslog("Get NLS app access token failed!");
    return;
  }

  const dumpFile = createWriteStream(outputFile, { flags: "w" });

  const tts = new nls.SpeechSynthesizer({
    url: process.env.ALIYUN_NLS_WS,
    appkey: process.env.ALIYUN_NLS_APP_KEY,
    token: token.Id,
  });

  tts.on("meta", (msg: unknown) => {
    syslog(`TTS Client received metainfo: ${msg}`);
  });

  tts.on("data", (msg: unknown) => {
    dumpFile.write(msg, "binary");
  });

  tts.on("completed", (msg: unknown) => {
    syslog(`TTS Client received completed: ${msg}`);
  });

  tts.on("closed", () => {
    syslog("TTS Client received closed.");
  });

  tts.on("failed", (msg: unknown) => {
    syslog(`TTS Client received failed: ${msg}`);
  });

  const param = tts.defaultStartParams();
  param.text = text;
  param.voice = process.env.ALIYUN_NLS_VOICE;
  try {
    await tts.start(param, true, 6000);
  } catch (error) {
    syslog(`Error on start TTS: ${error}`);
    return;
  } finally {
    dumpFile.end();
  }
  syslog("TTS synthesis done.");
}
