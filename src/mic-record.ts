import { createWriteStream } from "fs";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import mic from "mic";

export function micRecord(outputFile: string) {
  const micInstance = mic({
    rate: process.env.MIC_SAMPLE_RATE,
    channels: "1",
    debug: true,
    device: "default",
  });

  const micInputStream = micInstance.getAudioStream();
  const outputFileStream = createWriteStream(outputFile);
  micInputStream.pipe(outputFileStream);

  function stop() {
    micInstance.stop();
    micInputStream.destroy();
    outputFileStream.destroy();
  }

  micInstance.start();
  return stop;
}
