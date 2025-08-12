const SLEEPER_BASE = 'https://api.sleeper.app/v1';

export async function getUserByUsername(username: string) {
  const res = await fetch(`${SLEEPER_BASE}/user/${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error(`Sleeper user lookup failed: ${res.status}`);
  return res.json();
}

export async function getLeaguesForUser(userId: string, season: string) {
  const res = await fetch(`${SLEEPER_BASE}/user/${userId}/leagues/nfl/${season}`);
  if (!res.ok) throw new Error(`Sleeper leagues failed: ${res.status}`);
  return res.json();
}

export async function getDraftsForLeague(leagueId: string) {
  const res = await fetch(`${SLEEPER_BASE}/league/${leagueId}/drafts`);
  if (!res.ok) throw new Error(`Sleeper drafts failed: ${res.status}`);
  return res.json();
}

export async function getDraftPicks(draftId: string) {
  const res = await fetch(`${SLEEPER_BASE}/draft/${draftId}/picks`);
  if (!res.ok) throw new Error(`Sleeper draft picks failed: ${res.status}`);
  return res.json();
}

export async function getPlayersBlob() {
  const res = await fetch(`${SLEEPER_BASE}/players/nfl`);
  if (!res.ok) throw new Error(`Sleeper players failed: ${res.status}`);
  return res.json();
}
