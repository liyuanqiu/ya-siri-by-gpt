import { Configuration, OpenAIApi } from "openai";
import { syslog } from "../log";

export async function gptTextCompletion(prompt: string) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const openai = new OpenAIApi(configuration);

  syslog("GPT: I'm thinking...");

  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt,
    temperature: 0,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  return completion.data.choices[0]?.text;
}
