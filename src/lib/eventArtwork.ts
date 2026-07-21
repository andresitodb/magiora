export function shouldShowEventImage(
  imageUrl: string | null | undefined,
  failed: boolean
): boolean {
  return Boolean(imageUrl?.trim()) && !failed;
}
