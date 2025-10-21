
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