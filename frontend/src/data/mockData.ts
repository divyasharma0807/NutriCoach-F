export const appConfig = { appName: 'NutriCoach', version: '1.0.0' };

export interface User {
  id: string | null;
  name: string;
  email: string;
  role: 'client' | 'coach' | null;
  profileComplete: boolean;
  avatar: string | null;
  joinDate: string | null;
}

export const currentUser: User = { id: null, name: '', email: '', role: null, profileComplete: false, avatar: null, joinDate: null };

export function calculateBMI(weight: number, heightCm: number): number {
  if (!weight || !heightCm) return 0;
  const heightM = heightCm / 100;
  return weight / (heightM * heightM);
}

export function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'var(--blue)' };
  if (bmi < 25) return { label: 'Normal', color: 'var(--green)' };
  if (bmi < 30) return { label: 'Overweight', color: 'var(--warning)' };
  return { label: 'Obese', color: 'var(--danger)' };
}
