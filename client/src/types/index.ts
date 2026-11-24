export interface Member {
  id: number;
  homeId: number;
  name: string;
  email: string | null;
}

export interface SharedMember {
  name: string;
  email: string;
}

export interface Share {
  id: number;
  memberId: number;
  memberName?: string;
  amountCents: number;
  paidAt: string | null;
}

export interface Bill {
  id: number;
  homeId: number;
  title: string;
  totalCents: number;
  createdBy: number;
  sharedWith: SharedMember[];
  createdAt: string;
  shares: Share[];
}

export interface MembersResponse {
  members: Member[];
}

export interface BillsResponse {
  bills: Bill[];
}

export interface Balance {
  memberId: number;
  name: string;
  outstandingCents: number;
}

export interface BillsResponse {
  bills: Bill[];
}

export interface MembersResponse {
  members: Member[];
}

export interface BalancesResponse {
  balances: Balance[];
}

export interface PaymentResponse {
  id: number;
  memberId: number;
  amountCents: number;
  paidAt: string;
}

export interface CreateHomeResponse {
  id: number;
  name: string;
}

export interface CreateMemberResponse {
  id: number;
  homeId: number;
  name: string;
}
