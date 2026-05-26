import type { Donor } from "./types";

export const isCompany = (donor: Donor): boolean =>
  (donor.amount !== undefined && donor.amount >= 10_000) ||
  /ТОВ|ФОП|ПАТ|ПрАТ|ГО |МО |LLC|Ltd|&|corp/i.test(donor.name);
