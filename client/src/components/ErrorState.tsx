
interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="state-container error-state" role="alert">
      <div className="state-icon">!</div>
      <h3>Something went wrong</h3>
      <p>{message}</p>
      <button className="button button-primary" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
