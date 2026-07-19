type CastingEligibilityInput = {
  isMember: boolean;
  status: string;
  isOwner: boolean;
  applicationDeadline: string | null;
  alreadyApplied: boolean;
  now?: number;
};

export function castingApplicationIssue({
  isMember,
  status,
  isOwner,
  applicationDeadline,
  alreadyApplied,
  now = Date.now(),
}: CastingEligibilityInput): string | null {
  if (!isMember) return 'A Member subscription is required to apply.';
  if (status !== 'open') {
    return 'This casting call is not open for applications.';
  }
  if (isOwner) return 'You cannot apply to your own casting call.';
  if (applicationDeadline) {
    const value = applicationDeadline.includes('T')
      ? applicationDeadline
      : `${applicationDeadline}T23:59:59.999`;
    const deadline = new Date(value);
    if (!Number.isNaN(deadline.getTime()) && deadline.getTime() < now) {
      return 'The application deadline has passed.';
    }
  }
  if (alreadyApplied) {
    return 'You have already applied to this casting call.';
  }
  return null;
}
