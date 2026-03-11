export type UnitSystem = "imperial" | "metric";

export type Gender = "male" | "female" | null;

export interface UserProfile {
  email: string;
  name?: string | null;
  height_inches?: number | null;
  weight_lbs?: number | null;
  fitness_goals?: string[];
  gender?: Gender;
  providers?: string[];
}

export type Tab = "account" | "fitness";
