type VaultFeedbackMessagesProps = {
  errorMessage: string;
  successMessage: string;
};

export function VaultFeedbackMessages({
  errorMessage,
  successMessage,
}: VaultFeedbackMessagesProps) {
  return (
    <>
      {errorMessage ? <p className="mt-4 text-sm text-red-300">{errorMessage}</p> : null}
      {successMessage ? (
        <p className="mt-4 text-sm text-emerald-300">{successMessage}</p>
      ) : null}
    </>
  );
}
