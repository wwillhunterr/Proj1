import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import 'dotenv/config';
import { env } from './env';
import {
  getUserByUsername,
  getLeaguesForUser,
  getDraftsForLeague,
  getDraftPicks,
  getPlayersBlob
} from './sleeperAdapter';
import { recommend } from './reco';
import type { Player } from './types';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

// Link Sleeper (username + season)
app.get('/sleeper/:username/leagues', async (req, res) => {
  try {
    const { username } = req.params;
    const { season } = req.query as { season?: string };
    if (!season) return res.status(400).json({ error: 'season query required, e.g. 2025' });

    const user = await getUserByUsername(username);
    const leagues = await getLeaguesForUser(user.user_id, season);
    res.json({ user, leagues });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/sleeper/league/:leagueId/drafts', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const drafts = await getDraftsForLeague(leagueId);
    res.json({ drafts });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

let PLAYER_INDEX: Record<string, Player> = {};

async function buildPlayerIndex() {
  const blob = await getPlayersBlob();
  const out: Record<string, Player> = {};
  for (const [pid, p] of Object.entries<any>(blob)) {
    if (!p?.full_name || !p?.position) continue;
    out[pid] = {
      id: pid,
      name: p.full_name,
      pos: p.position,
      team: p.team,
      byeWeek: p?.bye_week,
      adp: undefined // fill from projections later
    };
  }
  PLAYER_INDEX = out;
}

io.on('connection', (socket) => {
  socket.on('draft:join', async ({ draftId }: { draftId: string }) => {
    socket.join(`draft:${draftId}`);

    let lastCount = -1;
    let polling = true;

    const poll = async () => {
      try {
        const picks = await getDraftPicks(draftId);
        if (picks.length !== lastCount) {
          lastCount = picks.length;

          const pickedIds = new Set<string>(picks.map((p: any) => String(p.player_id)));
          const available = Object.values(PLAYER_INDEX)
            .filter((p) => !pickedIds.has(p.id) && !['K', 'DEF'].includes(p.pos))
            .slice(0, 3000);

          // crude round calc: assumes 10-team league; tweak as needed
          const round = picks.length ? Math.floor(picks.length / 10) + 1 : 1;

          const reco = recommend(available, round);

          io.to(`draft:${draftId}`).emit('draft:server_state', {
            pickCount: picks.length,
            round
          });
          io.to(`draft:${draftId}`).emit('draft:recommendation', reco);
        }
      } catch (e) {
        console.error('poll error', e);
      } finally {
        if (polling) setTimeout(poll, 2500);
      }
    };

    poll();

    socket.on('disconnect', () => {
      polling = false;
    });
  });
});

server.listen(env.PORT, async () => {
  await buildPlayerIndex();
  console.log(`API listening on http://localhost:${env.PORT}`);
});
