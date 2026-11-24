export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export interface Home {
  id: number;
  name: string;
}

export interface Member {
  id: number;
  homeId: number;
  name: string;
}

export interface Bill {
  id: number;
  homeId: number;
  title: string;
  totalCents: number;
}

export interface Share {
  id: number;
  memberId: number;
  memberName?: string;
  amountCents: number;
  paidAt: string | null;
}

export interface Balance {
  memberId: number;
  name: string;
  outstandingCents: number;
}