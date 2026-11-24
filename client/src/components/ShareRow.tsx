
import { useState } from "react";
import type { Share } from "../types";
import { usePayShare } from "../lib/queries";

interface ShareRowProps {
  share: Share;
  billId: number;
  homeId: number;
}

function getPaymentKey(shareId: number): string {
  const storageKey = `payment-key-${shareId}`;
  const existingKey = localStorage.getItem(storageKey);

  if (existingKey) {
    return existingKey;
  }

  const newKey = crypto.randomUUID();
  localStorage.setItem(storageKey, newKey);

  return newKey;
}

export function ShareRow({
  share,
  billId,
  homeId,
}: ShareRowProps) {
  const payment = usePayShare(homeId);
  const [localError, setLocalError] = useState<string | null>(null);

  const isPaid = share.paidAt !== null;

  const isPaying =
    payment.isPending &&
    payment.variables?.shareId === share.id;

  const paymentError =
    payment.variables?.shareId === share.id
      ? payment.error
      : null;

  async function handlePayment() {
    if (isPaid || isPaying) return;

    setLocalError(null);

    const idempotencyKey = getPaymentKey(share.id);

    try {
      await payment.mutateAsync({
        billId,
        shareId: share.id,
        idempotencyKey,
      });

      localStorage.removeItem(`payment-key-${share.id}`);
    } catch {
      setLocalError(
        "Payment could not be confirmed. Please retry.",
      );
    }
  }

  return (
    <div className="share-row">
      <div className="member-info">
        <div className="avatar">
          {share.?memberName.charAt(0).toUpperCase()}
        </div>

        <div>
          <h4>{share.memberName}</h4>
          <p>
            {isPaid && share.paidAt
              ? `Paid on ${new Date(share.paidAt).toLocaleDateString()}`
              : "Pending payment"}
          </p>
        </div>
      </div>

      <div className="share-actions">
        <strong>
          ${(share.amountCents / 100).toFixed(2)}
        </strong>

        {isPaid ? (
          <span className="status status-paid">Paid</span>
        ) : (
          <button
            className="button button-small button-primary"
            onClick={handlePayment}
            disabled={isPaying}
          >
            {isPaying ? "Paying..." : "Pay now"}
          </button>
        )}
      </div>

      {(localError || paymentError) && (
        <p className="payment-error" role="alert">
          {localError || paymentError?.message}
        </p>
      )}
    </div>
  );
}
