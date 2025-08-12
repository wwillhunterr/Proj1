export type Player = {
  id: string;
  name: string;
  pos: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF' | string;
  team?: string;
  byeWeek?: number;
  adp?: number;
};

export type DraftState = {
  leagueId: string;
  draftId: string;
  round: number;
  picks: Array<{ overall: number; playerId: string; teamId: string }>;
  availablePlayerIds: string[];
  myTeamId?: string;
};

export type Recommendation = {
  primary: Player;
  backups: Player[];
  explanation: string;
};
