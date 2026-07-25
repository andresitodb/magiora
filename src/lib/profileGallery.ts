export const FREE_PROFILE_GALLERY_LIMIT = 3;
export const MEMBER_PROFILE_GALLERY_LIMIT = 10;

export function getProfileGalleryPresentation(imageCount: number, isMember: boolean) {
  const uploadLimit = isMember
    ? MEMBER_PROFILE_GALLERY_LIMIT
    : FREE_PROFILE_GALLERY_LIMIT;

  return {
    uploadLimit,
    includedCount: isMember
      ? imageCount
      : Math.min(imageCount, FREE_PROFILE_GALLERY_LIMIT),
    canUpload: imageCount < uploadLimit,
    showMemberBenefit: !isMember,
  };
}

export function canAddProfileGalleryFiles(
  imageCount: number,
  selectedFileCount: number,
  isMember: boolean,
) {
  const { uploadLimit } = getProfileGalleryPresentation(imageCount, isMember);
  return imageCount + selectedFileCount <= uploadLimit;
}
