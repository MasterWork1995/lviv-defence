export interface Donor {
  id: string;
  name: string;
  squareM2: number;
  sector: number | null;
  amount?: number;
}

export interface PanelStats {
  totalKm2: number;
  collectedKm2: number;
}
