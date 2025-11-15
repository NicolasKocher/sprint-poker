export enum TShirtSize {
  XS = 'XS',
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
}

export enum GameState {
  Idle = 'IDLE',
  Voting = 'VOTING',
  Finished = 'FINISHED',
}

export interface User {
  id: string;
  name: string;
}

export interface Session {
  id:string;
  users: User[];
  votes: Record<string, TShirtSize>; // key is userId
  gameState: GameState;
  hostId: string;
  votingStartTime: number | null;
}
