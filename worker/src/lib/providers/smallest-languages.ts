const normalizeLanguageCode = (languageCode: string) => {
  return languageCode.split("-")[0]?.toLowerCase() ?? "en";
};

export const toSmallestLanguageCode = (languageCode: string) => {
  const normalizedLanguage = normalizeLanguageCode(languageCode);
  return normalizedLanguage === "od" ? "or" : normalizedLanguage;
};
