export const parseKey = (key: string) => {
  const [shardId, id] = key.split(":");
  return { shardId, id };
};

export const randShard = (from = 1, to = 11) =>
  String(Math.floor(Math.random() * (to - from) + from));
