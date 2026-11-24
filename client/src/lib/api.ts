
import type {
  BillsResponse,
  BalancesResponse,
  MembersResponse,
  PaymentResponse,
  Member,
  Bill,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8787";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let response: Response;

  const token = sessionStorage.getItem("authToken");

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Unable to connect to the server. Please try again.",
      0
    );
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      response.ok
        ? "The server returned an invalid response."
        : "Something went wrong. Please try again.",
      response.status
    );
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : "Something went wrong. Please try again.";

    throw new ApiError(message, response.status);
  }

  return data as T;
}

export const api = {
  getMembers(homeId: number, signal?: AbortSignal) {
    return request<MembersResponse>(
      `/api/members/${homeId}/getMembers`,
      { signal }
    );
  },

  addMember(homeId: number, name: string, email: string) {
    return request<Member>(
      `/api/members/${homeId}/addMembers`,
      {
        method: "POST",
        body: JSON.stringify({ name, email }),
      }
    );
  },

  getBills(homeId: number, signal?: AbortSignal) {
    return request<BillsResponse>(
      `/api/bills/${homeId}/getBills`,
      { signal }
    );
  },

  createBill(
    homeId: number,
    title: string,
    totalCents: number
  ) {
    return request<Bill>(
      `/api/bills/${homeId}/createBills`,
      {
        method: "POST",
        body: JSON.stringify({ title, totalCents }),
      }
    );
  },

  getBalances(homeId: number, signal?: AbortSignal) {
    return request<BalancesResponse>(
      `/api/members/${homeId}/getBalances`,
      { signal }
    );
  },

  payShare(
    billId: number,
    shareId: number,
    idempotencyKey: string
  ) {
    return request<PaymentResponse>(
      `/api/bills/${billId}/shares/${shareId}/pay`,
      {
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
      }
    );
  },
};
