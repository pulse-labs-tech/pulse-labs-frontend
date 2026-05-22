const dictionaries: Record<string, () => Promise<any>> = {
  vi: () => import("./vi.json").then((module) => module.default),
  en: () => import("./en.json").then((module) => module.default),
};

export const getDictionary = async (locale: string) => {
  if (locale === "en") return dictionaries.en();
  return dictionaries.vi();
};
