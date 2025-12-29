import { createDeepInfra } from '@ai-sdk/deepinfra';
import { createDeepSeek } from '@ai-sdk/deepseek';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';



export const deepInfra = createDeepInfra({
  apiKey: process.env.DEEPINFRA_API_KEY!,
});

export const deepSeek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_OPENAI_KEY!,
});


export const getAiProvider = (name: 'deepinfra' | 'deepseek'): OpenAI => {
  dotenv.config();
  // const deepInfra = createDeepInfra({
  //   apiKey: process.env.DEEPINFRA_API_KEY!,
  // });

  // const deepSeek = createDeepSeek({
  //   apiKey: process.env.DEEPSEEK_OPENAI_KEY!,
  // });


  const deepInfraOpenAI: OpenAI = new OpenAI({
      apiKey: process.env.DEEPINFRA_API_KEY || '',
      baseURL: process.env.OPENAI_API_BASE_URL,
  });
  const deepSeekOpenAI: OpenAI = new OpenAI({
      apiKey: process.env.DEEPSEEK_OPENAI_KEY || '',
      baseURL: process.env.DEEPSEEK_OPENAI_BASE_URL,
  });

  switch (name) {
    case 'deepseek':
      return deepSeekOpenAI;
    case 'deepinfra':
      return deepInfraOpenAI;
    default:
      return deepInfraOpenAI;
  }
};