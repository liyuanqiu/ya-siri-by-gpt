import { rename } from "fs/promises";
import { last } from "lodash";
import { Gpio } from "onoff";
import { join, sep } from "path";
import { file, FileResult } from "tmp-promise";
import { createAliyunAccessTokenService } from "./aliyun/access-token-service";
import { stt } from "./aliyun/stt";
import { tts } from "./aliyun/tts";
import { gptTextCompletionAzure } from "./gpt/text-completion-azure";
import "./init";
import { logger } from "./log";
import { micRecord } from "./mic-record";
import { createSoundPlayer } from "./sound-player";
import { formatError, sleep } from "./util";

const button = new Gpio(24, "in", "both");

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const logIdentifier = last(__filename.split(sep))!;

async function getAliyunToken() {
  const nlsTokenService = createAliyunAccessTokenService(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    process.env.ALIYUN_NLS_TOKEN_ENDPOINT!
  );

  const token =
    process.env.NODE_ENV === "Dev"
      ? {
          UserId: "1234567890",
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          Id: process.env.TESTING_ALIYUN_NLS_ACCESS_TOKEN!,
          ExpireTime: 2000000000,
        }
      : await nlsTokenService.getToken();

  if (token === null) {
    logger.error(`${logIdentifier} Failed to get the aliyun nls access token.`);
    throw new Error("Failed to get the aliyun nls access token.");
  }

  return token;
}

const soundPlayer = createSoundPlayer();

function playIntro() {
  return soundPlayer.play(join(__dirname, "..", "sound", "intro.wav"));
}

function playAskMe() {
  return soundPlayer.play(join(__dirname, "..", "sound", "ask-me.wav"));
}

function playGotIt() {
  return soundPlayer.play(join(__dirname, "..", "sound", "got-it.wav"));
}

function playThinking() {
  return soundPlayer.play(join(__dirname, "..", "sound", "thinking.wav"));
}

function playNotClear() {
  return soundPlayer.play(join(__dirname, "..", "sound", "not-clear.wav"));
}

(async () => {
  const token = await getAliyunToken();

  let micFile: FileResult | null = null;
  let stopMic = () => {};
  let isRecording = false;
  let isProcessing = false;

  playIntro();

  async function onPress() {
    if (isProcessing) {
      logger.info(`${logIdentifier} 正在回答问题，忽略按钮信号。。。`);
      return;
    }
    if (isRecording) {
      logger.info(`${logIdentifier} 开始回答问题。。。`);
      isProcessing = true;
      isRecording = false;
      const text = await _stt();
      if (text === undefined) {
        playNotClear();
        isProcessing = false;
        return;
      }

      const intervalId = setInterval(() => {
        playThinking();
      }, 10000);

      const answer = await gptTextCompletionAzure(text);
      clearInterval(intervalId);

      if (answer !== undefined && answer.length > 0) {
        await _tts(answer);
      }
      isProcessing = false;
      return;
    }
    logger.info(`${logIdentifier} 开始录音。。。`);
    isRecording = true;
    const tmpFilePromise = file();
    await playAskMe();
    micFile = await tmpFilePromise;
    stopMic = micRecord(micFile.path);
  }

  async function _stt() {
    stopMic();
    if (micFile === null) {
      return undefined;
    }
    await sleep(500);
    playGotIt();
    try {
      const text = await stt(micFile.path, token.Id);
      return text;
    } catch (e) {
      return undefined;
    } finally {
      await micFile.cleanup();
      micFile = null;
    }
  }

  async function _tts(answer: string) {
    const answerFile = await file();
    await tts(answer, answerFile.path, token.Id);
    const wavFile = `${answerFile.path}.wav`;
    await rename(answerFile.path, wavFile);
    await soundPlayer.play(wavFile);
    answerFile.cleanup();
  }

  button.watch(async (err, value) => {
    if (err) {
      logger.error(`${logIdentifier} GPIO error: ${formatError(err)}`);
      return;
    }
    if (value === 0) {
      onPress();
    }
  });
})();
