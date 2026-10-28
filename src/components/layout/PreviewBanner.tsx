export const PRIVATE_PREVIEW_MESSAGE =
  "Private preview — demonstration data only. This is not an official or government land verification service.";

export function PreviewBanner({ enabled }: Readonly<{ enabled: boolean }>) {
  if (!enabled) return null;

  return (
    <div className="preview-banner" role="note">
      <div className="page-container">{PRIVATE_PREVIEW_MESSAGE}</div>
    </div>
  );
}
