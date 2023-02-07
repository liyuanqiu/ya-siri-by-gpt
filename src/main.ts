import { config } from "dotenv";
import { Configuration, OpenAIApi } from "openai";
import { join } from "path";

config({
  path: join(__dirname, "..", ".env"),
});

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);
(async () => {
  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: "十三加六等于几？请用中文进行回答。",
    temperature: 0,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  console.log(completion.data.choices[0].text);
})();
