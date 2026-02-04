export enum CHAT_ROLE {
  USER = 'User',
  AI = 'AI',
}

export interface SingleMgs {
  role: CHAT_ROLE;
  content: string;
}
