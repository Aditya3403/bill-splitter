
import { useState } from "react";
import type { FormEvent } from "react";
import { useParams } from "@tanstack/react-router";

import {
  useMembers,
  useBills,
  useBalances,
  useAddMember,
  useCreateBill,
} from "../lib/queries";

import type { Member, Bill, Balance } from "../types";
import { BillCard } from "../components/BillCard";

type ModalType = "member" | "bill" | null;

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getSplit(totalCents: number, memberCount: number) {
  if (memberCount === 0) return [];

  const baseAmount = Math.floor(totalCents / memberCount);
  const remainder = totalCents % memberCount;

  return Array.from({ length: memberCount }, (_, index) => ({
    amountCents: baseAmount + (index < remainder ? 1 : 0),
  }));
}

export function HomePage() {
  const { homeId: homeIdParam } = useParams({
    from: "/homes/$homeId",
  });

  const homeId = Number(homeIdParam);
  
  const membersQuery = useMembers(homeId);
  const billsQuery = useBills(homeId);
  const balancesQuery = useBalances(homeId);

  const addMemberMutation = useAddMember(homeId);
  const createBillMutation = useCreateBill(homeId);

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState(""); 
  const [billTitle, setBillTitle] = useState("");
  const [billAmount, setBillAmount] = useState("");

  const [formError, setFormError] = useState("");

  if (!Number.isSafeInteger(homeId) || homeId <= 0) {
    return (
      <main className="dashboard">
        <div className="state-container">
          <h2>Invalid home ID</h2>
          <p>Please provide a valid home ID.</p>
        </div>
      </main>
    );
  }

  const membersLoading = membersQuery.isPending;
  const billsLoading = billsQuery.isPending;

  const members: Member[] =
    membersQuery.data?.members ?? [];

  const homeBills: Bill[] =
    billsQuery.data?.bills ?? [];

  const balances: Balance[] =
    balancesQuery.data?.balances ?? [];

  const totalCents = homeBills.reduce(
    (total, bill) => total + bill.totalCents,
    0
  );

  const paidCents = homeBills.reduce(
    (total, bill) =>
      total +
      bill.shares.reduce(
        (sum, share) =>
          sum + (share.paidAt ? share.amountCents : 0),
        0
      ),
    0
  );

  const outstandingCents = balances.reduce(
    (total, balance) =>
      total + balance.outstandingCents,
    0
  );

  const parsedBillAmount =
    billAmount.trim() !== "" &&
    /^\d+(\.\d{1,2})?$/.test(billAmount.trim())
      ? Math.round(Number(billAmount) * 100)
      : 0;

  const billPreview = getSplit(
    parsedBillAmount,
    members.length
  );

  function openModal(type: ModalType) {
    setFormError("");
    setMemberName("");
    setMemberEmail("");
    setBillTitle("");
    setBillAmount("");
    setActiveModal(type);
  }

  function closeModal() {
    setActiveModal(null);
    setFormError("");
  }

  // Add member
  async function handleAddMember(
  event: FormEvent<HTMLFormElement>
) {
  event.preventDefault();
  setFormError("");

  const name = memberName.trim();
  const email = memberEmail.trim().toLowerCase();

  if (name.length < 2) {
    setFormError("Member name must contain at least 2 characters.");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFormError("Please enter a valid email address.");
    return;
  }

  const exists = members.some(
    (member) =>
      member.name.toLowerCase() === name.toLowerCase() ||
      member.email?.toLowerCase() === email
  );

  if (exists) {
    setFormError("This member has already been added.");
    return;
  }

  try {
    await addMemberMutation.mutateAsync({ name, email });
    closeModal();
  } catch (error) {
    setFormError(
      error instanceof Error
        ? error.message
        : "Unable to add member. Please try again."
    );
  }
}

  // Create bill
  async function handleAddBill(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setFormError("");

    if (members.length === 0) {
      setFormError(
        "Please add at least one household member before creating a bill."
      );
      return;
    }

    const title = billTitle.trim();

    if (title.length < 2) {
      setFormError("Please enter a valid bill title.");
      return;
    }

    if (
      !/^\d+(\.\d{1,2})?$/.test(billAmount.trim()) ||
      !Number.isSafeInteger(parsedBillAmount) ||
      parsedBillAmount <= 0
    ) {
      setFormError(
        "Enter a valid positive amount with up to 2 decimal places."
      );
      return;
    }

    try {
      await createBillMutation.mutateAsync({
        title,
        totalCents: parsedBillAmount,
      });

      closeModal();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to create bill. Please try again."
      );
    }
  }

  return (
    <main className="dashboard">

      <header className="dashboard-header">
        <div>
          <p className="eyebrow">
            HOUSEHOLD MANAGEMENT
          </p>

          <h1>My Home</h1>

          <p className="subtitle">
            Manage your shared expenses and payments.
          </p>
        </div>

        <div className="profile-wrapper">
          <button
            className="profile-trigger"
            onClick={() =>
              setProfileOpen((current) => !current)
            }
            aria-expanded={profileOpen}
            aria-label="Open profile menu"
          >
            <span className="profile-avatar">A</span>

            <span className="profile-trigger-info">
              <strong>Aditya Bansal</strong>
              <small>Home owner</small>
            </span>

            <span className="profile-chevron">
              {profileOpen ? "⌃" : "⌄"}
            </span>
          </button>

          {profileOpen && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-header">
                <strong>Aditya Bansal</strong>
                <span>aditya@example.com</span>
              </div>

              <button
                onClick={() => setProfileOpen(false)}
              >
                <span>◉</span> My profile
              </button>

              <button
                onClick={() => setProfileOpen(false)}
              >
                <span>⚙</span> Settings
              </button>

              <div className="profile-dropdown-divider" />

              <button
                className="logout-option"
                onClick={() => setProfileOpen(false)}
              >
                <span>↪</span> Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <section className="summary-grid">
        <div className="summary-card">
          <span>Total expenses</span>
          <h2>{formatMoney(totalCents)}</h2>
          <p>Across all bills</p>
        </div>

        <div className="summary-card">
          <span>Amount paid</span>
          <h2 className="green-text">
            {formatMoney(paidCents)}
          </h2>
          <p>Successfully settled</p>
        </div>

        <div className="summary-card">
          <span>Outstanding</span>
          <h2 className="orange-text">
            {formatMoney(outstandingCents)}
          </h2>
          <p>Pending payments</p>
        </div>
      </section>

      {/* Household members */}

      <section className="members-section">
        <div className="section-heading">
          <div>
            <h2>Household members</h2>
            <p>
              Manage the people sharing your expenses.
            </p>
          </div>

          <button
            className="action-button"
            onClick={() => openModal("member")}
          >
            + Add member
          </button>
        </div>

        {membersLoading ? (
          <p>Loading members...</p>
        ) : members.length === 0 ? (
          <p>Add members to get started</p>
        ) : (
          <div className="members-grid">
            {members.map((member, index) => {
              const balance = balances.find(
                (item) => item.memberId === member.id
              );

              return (
                <div
                  className="member-card"
                  key={member.id}
                >
                  <div className="member-card-top">
                    <div className="member-avatar">
                      {getInitials(member.name)}
                    </div>

                    <span className="member-number">
                      MEMBER{" "}
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3>{member.name}</h3>

                  <div className="member-balance">
                    <span>Outstanding balance</span>

                    <strong>
                      {formatMoney(
                        balance?.outstandingCents ?? 0
                      )}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Household bills */}

      <section className="bills-section">
        <div className="section-heading">
          <div>
            <h2>Household bills</h2>
            <p>
              Track individual shares and payments.
            </p>
          </div>

          <button
            className="action-button"
            onClick={() => openModal("bill")}
          >
            + Add bill
          </button>
        </div>

        {billsLoading ? (
          <p>Loading bills...</p>
        ) : homeBills.length === 0 ? (
          <p>Create a bill to get started</p>
        ) : (
          <div className="bills-grid">
            {homeBills.map((bill) => (
              <BillCard
                key={bill.id}
                bill={bill}
                homeId={homeId}
              />
            ))}
          </div>
        )}
      </section>


      {activeModal && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="dashboard-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-modal-title"
          >
            <button
              className="modal-close"
              onClick={closeModal}
              aria-label="Close modal"
            >
              ×
            </button>

            {/* Add member modal */}

            {activeModal === "member" ? (
              <>
                <div className="modal-heading-icon">
                  ♙
                </div>

                <h2 id="dashboard-modal-title">
                  Add household member
                </h2>

                <p className="modal-description">
                  Invite another person to share household
                  expenses.
                </p>

                <form onSubmit={handleAddMember}>
                  <label htmlFor="member-name">
                    Member name
                  </label>

                  <input
                    id="member-name"
                    type="text"
                    placeholder="Enter full name"
                    value={memberName}
                    onChange={(event) =>
                      setMemberName(event.target.value)
                    }
                    required
                    minLength={2}
                    maxLength={100}
                    autoFocus
                  />

                  <label htmlFor="member-email">
                    Member email
                  </label>

                  <input
                    id="member-email"
                    type="email"
                    placeholder="Enter email address"
                    value={memberEmail}
                    onChange={(event) => setMemberEmail(event.target.value)}
                    required
                    maxLength={255}
                  />

                  {formError && (
                    <p
                      className="form-error"
                      role="alert"
                    >
                      {formError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="modal-submit"
                    disabled={addMemberMutation.isPending}
                  >
                    {addMemberMutation.isPending
                      ? "Adding member..."
                      : "Add member →"}
                  </button>
                </form>
              </>
            ) : (
              <>
                {/* Bill modal */}

                <div className="modal-heading-icon">
                  ↗
                </div>

                <h2 id="dashboard-modal-title">
                  Create a new bill
                </h2>

                <p className="modal-description">
                  Enter the bill details. The amount will
                  be split equally among all household
                  members.
                </p>

                <form onSubmit={handleAddBill}>
                  <label htmlFor="bill-title">
                    Bill title
                  </label>

                  <input
                    id="bill-title"
                    type="text"
                    placeholder="e.g. Electricity bill"
                    value={billTitle}
                    onChange={(event) =>
                      setBillTitle(event.target.value)
                    }
                    required
                    minLength={2}
                    maxLength={150}
                  />

                  <label htmlFor="bill-amount">
                    Total amount ($)
                  </label>

                  <input
                    id="bill-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="e.g. 120.00"
                    value={billAmount}
                    onChange={(event) =>
                      setBillAmount(event.target.value)
                    }
                    required
                  />


                  <div className="bill-preview">
                    <div className="bill-preview-heading">
                      <strong>Split preview</strong>
                      <span>{members.length} members</span>
                    </div>

                    {members.length === 0 ? (
                      <p>
                        Add members to see the bill split.
                      </p>
                    ) : (
                      members.map((member, index) => (
                        <div
                          className="bill-preview-member"
                          key={member.id}
                        >
                          <span>{member.name}</span>

                          <strong>
                            {formatMoney(
                              billPreview[index]?.amountCents ?? 0
                            )}
                          </strong>
                        </div>
                      ))
                    )}

                    <div className="bill-preview-total">
                      <span>Total bill</span>

                      <strong>
                        {formatMoney(parsedBillAmount)}
                      </strong>
                    </div>
                  </div>

                  {formError && (
                    <p
                      className="form-error"
                      role="alert"
                    >
                      {formError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="modal-submit"
                    disabled={
                      members.length === 0 ||
                      createBillMutation.isPending
                    }
                  >
                    {createBillMutation.isPending
                      ? "Creating bill..."
                      : "Create bill →"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

    </main>
  );
}
