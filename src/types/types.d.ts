import { Request } from "express";
import PocketBase from 'pocketbase';

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

export interface InferenceBody {
  message: string;
  messages?: ChatMessage[];
  params: {
    country: string | number;
    provider: string | number;
    expflow?: string | null;
    chat_id?: string | null;
    client_id?: string | null;
  };
}

export interface ClientRecord {
  id?: string | null;
  client_id?: string | null;
  email?: string | null;
  name?: string | null;
  city?: string | null;
}
export interface InferenceRequest extends Request {
  pb?: PocketBase
  pbSuperAdmin?: PocketBase,
  userProfile?: ClientRecord | null;

  system?: {
    user_message_saved?: boolean;
    middleware_chat_id?: string;
    summaries?: {
      general_summary?: string | null;
      last_intent_summary?: string | null;
    };
  };
}

export interface ChatSummary {
  can_decide: boolean;
  user_intent_summary: string;
  motivation: string;
  preferences: Record<string, string>;
  rolling_summary: string;
  last_request: string;
}