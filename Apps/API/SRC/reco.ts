import type { Player, Recommendation } from './types';

const POS_PRIORITY = ['RB', 'WR', 'TE', 'QB', 'DEF', 'K'];

export function recommend(
  available: Player[],
  round: number,
  myNeeds?: Partial<Record<string, number>>
): Recommendation {
  const sorted = [...available].sort((a, b) => {
    const pa = POS_PRIORITY.indexOf(a.pos);
    const pb = POS_PRIORITY.indexOf(b.pos);
    if (pa !== pb) return pa - pb;
    const adpA = a.adp ?? Number.MAX_SAFE_INTEGER;
    const adpB = b.adp ?? Number.MAX_SAFE_INTEGER;
    return adpA - adpB;
  });

  const primary = sorted[0];
  const backups = sorted.slice(1, 4);
  const explanation = `Prioritizing ${primary.pos} based on early-round scarcity and ADP value.`;
  return { primary, backups, explanation };
}
