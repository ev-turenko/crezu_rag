import { Request } from "express";

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

interface ChatDataItemAction {
  text: string;
  type: 'link' | 'button';
  destination: string;
}

interface ChatDataItem {
  type?: ContentDataType;
  content: string | Offer[];
  actions?: ChatDataItemAction[];
  tags?: string[];
  isError?: boolean;
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
  message: string
  params: {
    country: string | number
    provider: string | number
    expflow?: string | null
    chat_id?: string | null
    client_id?: string | null
  }
}