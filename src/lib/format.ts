export const formatUah = (amount: number, locale: string): string =>
  new Intl.NumberFormat(locale === "uk" ? "uk-UA" : "en-US").format(amount);
