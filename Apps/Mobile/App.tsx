import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import io from 'socket.io-client';

export default function App() {
  const [apiBase, setApiBase] = useState('http://localhost:4000');
  const [username, setUsername] = useState('');
  const [season, setSeason] = useState('2025');
  const [leagues, setLeagues] = useState<any[]>([]);
  const [leagueId, setLeagueId] = useState('');
  const [draftId, setDraftId] = useState('');

  const [reco, setReco] = useState<any | null>(null);
  const [state, setState] = useState<any | null>(null);

  const socket = useMemo(() => io(apiBase, { transports: ['websocket'] }), [apiBase]);

  useEffect(() => {
    socket.on('draft:server_state', (s) => setState(s));
    socket.on('draft:recommendation', (r) => setReco(r));
    return () => {
      socket.off('draft:server_state');
      socket.off('draft:recommendation');
    };
  }, [socket]);

  const fetchLeagues = async () => {
    const res = await fetch(`${apiBase}/sleeper/${encodeURIComponent(username)}/leagues?season=${season}`);
    const data = await res.json();
    setLeagues(data.leagues || []);
  };

  const fetchDrafts = async (lid: string) => {
    setLeagueId(lid);
    const res = await fetch(`${apiBase}/sleeper/league/${lid}/drafts`);
    const data = await res.json();
    const first = data.drafts?.[0];
    if (first) setDraftId(first.draft_id);
  };

  const joinDraft = () => {
    if (!draftId) return;
    socket.emit('draft:join', { draftId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Fantasy AI – Sleeper MVP</Text>

      <Text style={styles.label}>API Base</Text>
      <TextInput value={apiBase} onChangeText={setApiBase} style={styles.input} />

      <Text style={styles.label}>Sleeper Username</Text>
      <TextInput value={username} onChangeText={setUsername} style={styles.input} placeholder="your_sleeper_name" />

      <Text style={styles.label}>Season</Text>
      <TextInput value={season} onChangeText={setSeason} style={styles.input} />

      <TouchableOpacity style={styles.btn} onPress={fetchLeagues}>
        <Text style={styles.btnText}>Fetch Leagues</Text>
      </TouchableOpacity>

      {leagues.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.label}>Select League</Text>
          {leagues.map((l) => (
            <TouchableOpacity key={l.league_id} style={styles.row} onPress={() => fetchDrafts(l.league_id)}>
              <Text style={styles.rowText}>{l.name} · {l.league_id}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {draftId ? (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.label}>Draft ID</Text>
          <Text style={styles.code}>{draftId}</Text>
          <TouchableOpacity style={styles.btn} onPress={joinDraft}>
            <Text style={styles.btnText}>Join Draft</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {state && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.sub}>Round: {state.round} · Picks: {state.pickCount}</Text>
        </View>
      )}

      {reco && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Next Pick</Text>
          <Text style={styles.cardMain}>{reco.primary.name} ({reco.primary.pos})</Text>
          <Text style={styles.cardSub}>{reco.explanation}</Text>
          <Text style={[styles.cardTitle,{marginTop:8}]}>Backups</Text>
          {reco.backups.map((b:any) => (
            <Text key={b.id} style={styles.cardLine}>• {b.name} ({b.pos})</Text>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 16 },
  btn: { backgroundColor: '#111', padding: 12, borderRadius: 10, marginTop: 10, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: '700' },
  row: { paddingVertical: 10 },
  rowText: { fontSize: 16 },
  code: { fontFamily: 'Courier', fontSize: 13, backgroundColor: '#eee', padding: 8, borderRadius: 6 },
  sub: { fontSize: 14, color: '#555' },
  card: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12, marginTop: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardMain: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  cardSub: { fontSize: 13, color: '#666', marginTop: 4 },
  cardLine: { fontSize: 15, marginTop: 2 }
});
