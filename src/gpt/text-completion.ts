import { last } from "lodash";
import { Configuration, OpenAIApi } from "openai";
import { sep } from "path";
import { logger } from "../log";
import { formatError, retryFunction } from "../util";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const logIdentifier = last(__filename.split(sep))!;

export async function gptTextCompletion(prompt: string, retry = 3) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const openai = new OpenAIApi(configuration);

  logger.info(`${logIdentifier} I'm thinking...`);

  const intervalId = setInterval(() => {
    logger.info(`${logIdentifier} ...`);
  }, 1000);

  try {
    const completion = await retryFunction(
      () =>
        openai.createCompletion({
          model: "text-davinci-003",
          prompt: `${prompt}？请用儿歌来回答，不超过50个字。`,
          temperature: 0.7,
          max_tokens: 256,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        }),
      retry,
      (retry, error) => {
        logger.error(
          `${logIdentifier} GPT service error: ${formatError(
            error
          )}. [retry(${retry})]`
        );
      }
    );

    return completion.data.choices[0]?.text?.trim();
  } catch (error) {
    logger.error(`${logIdentifier} GPT service error: ${formatError(error)}`);
  } finally {
    clearInterval(intervalId);
  }
}
