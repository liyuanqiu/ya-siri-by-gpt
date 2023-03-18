import axios from "axios";
import { last } from "lodash";
import { CreateCompletionRequest, CreateCompletionResponse } from "openai";
import { sep } from "path";
import { logger } from "../log";
import { formatError, retryFunction } from "../util";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const logIdentifier = last(__filename.split(sep))!;

export async function gptTextCompletionAzure(prompt: string, retry = 3) {
  const endpoint =
    process.env.OPENAI_AZURE_API_BASEPATH +
    "/openai/deployments/" +
    process.env.OPENAI_AZURE_API_DEPLOYMENT_NAME +
    "/completions?api-version=" +
    process.env.OPENAI_AZURE_API_VERSION;

  const headers = {
    "api-key": process.env.OPENAI_AZURE_API_KEY,
    "Content-Type": "application/json",
  };

  const payload: CreateCompletionRequest = {
    model: "text-davinci-003",
    prompt: `${prompt}${process.env.PROMPT_SUFFIX}\n\n`,
    temperature: 0.7,
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  };

  logger.info(`${logIdentifier} I'm thinking...`);

  const intervalId = setInterval(() => {
    logger.info(`${logIdentifier} ...`);
  }, 1000);

  try {
    const completion = await retryFunction(
      () =>
        axios.post<CreateCompletionResponse>(endpoint, payload, {
          headers,
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

if (require.main === module) {
  (async () => {
    require("../init");
    const text = await gptTextCompletionAzure("三加九等于几？");
    console.log(text);
  })();
}
