export const getVoterId = (): string => {
  if (typeof window === "undefined") return "server-voter";
  const KEY = "lumos_voter_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
};
