export type NewsConfig = {
  id: string;
  title: string;
  body: string;
  bullets: readonly string[];
};

// Set this to a NewsConfig to show a one-time update modal. Keep null when there is no active news.
export const currentNews: NewsConfig | null = null;
