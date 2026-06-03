export class Player {
  id: string;
  username: string;
  joinedAt: Date;
  isConnected: boolean;
  score: number;
  turnsPlayed: number;

  constructor(id: string, username: string) {
    this.id = id;
    this.username = username;
    this.joinedAt = new Date();
    this.isConnected = true;
    this.score = 0;
    this.turnsPlayed = 0;
  }
}
