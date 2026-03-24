interface ActionRecord {
  count: number;
  timestamps: number[];
}

const actionMap = new Map<string, ActionRecord>();

function key(guildId: string, userId: string, action: string): string {
  return `${guildId}:${userId}:${action}`;
}

export function recordAction(guildId: string, userId: string, action: string, windowSecs: number): number {
  const k = key(guildId, userId, action);
  const now = Date.now();
  const cutoff = now - windowSecs * 1000;
  let record = actionMap.get(k);
  if (!record) {
    record = { count: 0, timestamps: [] };
    actionMap.set(k, record);
  }
  record.timestamps = record.timestamps.filter((t) => t > cutoff);
  record.timestamps.push(now);
  record.count = record.timestamps.length;
  return record.count;
}

export function resetActions(guildId: string, userId: string): void {
  for (const k of actionMap.keys()) {
    if (k.startsWith(`${guildId}:${userId}:`)) actionMap.delete(k);
  }
}

const joinMap = new Map<string, number[]>();

export function recordJoin(guildId: string, windowSecs: number): number {
  const now = Date.now();
  const cutoff = now - windowSecs * 1000;
  let joins = joinMap.get(guildId) ?? [];
  joins = joins.filter((t) => t > cutoff);
  joins.push(now);
  joinMap.set(guildId, joins);
  return joins.length;
}

export function resetJoins(guildId: string): void {
  joinMap.delete(guildId);
}

const lockedGuilds = new Set<string>();

export function setLockdown(guildId: string, locked: boolean): void {
  if (locked) lockedGuilds.add(guildId);
  else lockedGuilds.delete(guildId);
}

export function isLocked(guildId: string): boolean {
  return lockedGuilds.has(guildId);
}
