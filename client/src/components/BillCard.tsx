
import type { Bill } from "../types";
import { ShareRow } from "./ShareRow";

interface BillCardProps {
  bill: Bill;
  homeId: number;
}

export function BillCard({ bill, homeId }: BillCardProps) {
  const paidCents = bill.shares.reduce(
    (total, share) =>
      total + (share.paidAt ? share.amountCents : 0),
    0,
  );

  const progress =
    bill.totalCents > 0
      ? (paidCents / bill.totalCents) * 100
      : 0;

  const isFullyPaid = progress === 100;

  return (
    <article className="bill-card">
      <div className="bill-header">
        <div>
          <h3>{bill.title}</h3>
          <p>
            {bill.shares.length} members sharing this bill
          </p>
        </div>

        <div className="bill-total">
          ${(bill.totalCents / 100).toFixed(2)}
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-label">
          <span>Settlement progress</span>
          <strong>{Math.round(progress)}%</strong>
        </div>

        <div
          className="progress-track"
          role="progressbar"
          aria-label={`${bill.title} payment progress`}
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="progress-description">
          ${(paidCents / 100).toFixed(2)} paid of $
          {(bill.totalCents / 100).toFixed(2)}
        </p>
      </div>

      <div className="bill-status">
        <span
          className={
            isFullyPaid
              ? "status status-paid"
              : "status status-pending"
          }
        >
          {isFullyPaid ? "Fully settled" : "Awaiting payments"}
        </span>
      </div>

      <div className="shares-list">
        {bill.shares.map((share) => (
          <ShareRow
            key={share.id}
            share={share}
            billId={bill.id}
            homeId={homeId}
          />
        ))}
      </div>
    </article>
  );
}
