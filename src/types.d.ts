import { Request } from 'express';
import { ModelMessage } from 'ai';
import { MessageFormat, TextFormat } from './enums/enums.ts';
import { DeepInfraProvider } from '@ai-sdk/deepinfra';
import { DeepSeekProvider } from '@ai-sdk/deepseek';
import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

export interface ChatMessage {
  index: number;
  role: "system" | "user" | "assistant";
  data: [
    {
      content: string | any
    }
  ]
}

export interface ChatRequest {
  chat_id?: string;
  messages: ChatMessage[]
}

interface ChatResponse {
  success: boolean;
  chat_id: number;
  messages?: Message[];
}

interface Message {
  index: number;
  role: ChatRole;
  data: ChatDataItem[];
}

interface ChatDataItem {
  type?: ContentDataType;
  content: string | Offer[];
  tags?: string[];
}

interface ChatNotification {
  title: string;
  text: string;
  level: NotificationLevel;
  [key: string]: any;
}

interface Offer {
  [key: string]: any;
}

interface Suggestion {
	title: string;
	text: string;
	prompt: string;
	id: number;
  category: string
}

interface SuggestionsResponse {
  success: boolean;
  suggestions?: Suggestion[];
}



export interface InferenceRequest extends Request {
  f_country_id: number
  f_provider_id?: number
  f_messages: ChatCompletionMessageParam[]
  f_message: string
  f_text_format?: TextFormat
  f_message_format?: MessageFormat
  f_chat_id?: string
  f_client_id?: string
  f_device?: Record<string, any>,
  f_summary?: {
    general_summary?: string;
    last_intent_summary?: string;
  }
}