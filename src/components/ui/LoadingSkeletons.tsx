function Line({ width = "100%" }: Readonly<{ width?: string }>) {
  return <span className="skeleton skeleton--line" style={{ width }} />;
}

function CaseCardSkeleton() {
  return <div className="skeleton-card"><div className="skeleton-row"><Line width="35%" /><span className="skeleton skeleton--chip" /></div><Line width="62%" /><Line /><Line width="82%" /><div className="skeleton-progress"><Line /><Line /><Line /></div></div>;
}

function LoadingFrame({ label, children, staff = false }: Readonly<{ label: string; children: React.ReactNode; staff?: boolean }>) {
  return <main className={`page-container page-main ${staff ? "page-container--staff" : ""}`} aria-busy="true" aria-live="polite"><p className="sr-only" role="status">{label}</p><div className="loading-layout" aria-hidden="true">{children}</div></main>;
}

export function CustomerDashboardSkeleton() {
  return <LoadingFrame label="Loading your cases"><div className="skeleton-heading"><Line width="20%" /><Line width="52%" /><Line width="38%" /></div><div className="skeleton-case-grid"><CaseCardSkeleton /><CaseCardSkeleton /><CaseCardSkeleton /></div></LoadingFrame>;
}

export function StaffQueueSkeleton() {
  return <LoadingFrame label="Loading your work queue" staff><div className="skeleton-heading"><Line width="18%" /><Line width="45%" /><Line width="32%" /></div><div className="skeleton-metrics"><div /><div /><div /></div><div className="skeleton-queue"><section><Line width="55%" /><CaseCardSkeleton /></section><section><Line width="45%" /><CaseCardSkeleton /></section><section><Line width="52%" /><CaseCardSkeleton /></section></div></LoadingFrame>;
}

export function CaseDetailSkeleton({ staff = false }: Readonly<{ staff?: boolean }>) {
  return <LoadingFrame label={staff ? "Loading staff case details" : "Loading case details"} staff={staff}><div className="skeleton-heading"><Line width="22%" /><Line width="58%" /><Line width="40%" /></div><div className="skeleton-detail"><section className="skeleton-card"><Line width="35%" /><Line /><Line width="88%" /><Line width="70%" /><div className="skeleton-document"><Line width="50%" /><Line width="78%" /></div></section><aside className="skeleton-card"><Line width="40%" /><div className="skeleton-timeline"><Line /><Line width="82%" /><Line width="70%" /><Line width="88%" /></div></aside></div></LoadingFrame>;
}
