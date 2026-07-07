export function SubmissionStatusBadge({ status }: { status: string }) {
  const statusConfig = {
    PENDING: { color: 'bg-yellow-100 text-yellow-800', text: 'Väntar' },
    APPROVED: { color: 'bg-green-100 text-green-800', text: 'Godkänd' },
    REJECTED: { color: 'bg-red-100 text-red-800', text: 'Avvisad' },
    ID06_REGISTERED: { color: 'bg-blue-100 text-blue-800', text: 'ID06 Registrerad' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.PENDING;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.text}
    </span>
  );
}