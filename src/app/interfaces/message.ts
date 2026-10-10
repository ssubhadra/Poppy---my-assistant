export type MessageFrom = 'user' | 'assistant';

export interface ChatMessage {
  id: number;
  from: MessageFrom;
  text: string;
  modelName?: string;
  timestamp: Date;
  animate?: boolean;
}
