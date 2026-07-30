// =============================================================================
// Analytics Tracking Script (Server Component)
// =============================================================================
// Emits a lightweight inline <script> tag that auto-tracks page views on
// published sites. Uses sendBeacon for reliable delivery. No external
// dependencies — the script is ~1KB inline.
//
// Usage:
//   <AnalyticsScript projectId={project.id} />
//
// Injected into published site routes (Server Component, zero client bundle).
// =============================================================================

interface AnalyticsScriptProps {
  projectId: string;
}

/**
 * Build the inline tracking script as a string. Keeping it as a function
 * makes it testable and keeps the JSX clean.
 */
function buildTrackingScript(projectId: string): string {
  // Escape projectId to prevent XSS (only allow alphanumeric, hyphens, underscores)
  const safeId = projectId.replace(/[^a-zA-Z0-9_-]/g, '');

  return `
(function(){
  var p="${safeId}";
  var t=window.location.pathname;
  var r=document.referrer||"";
  var u=navigator.userAgent||"";
  try{
    navigator.sendBeacon("/api/analytics/track",
      new Blob([JSON.stringify({
        projectId:p,
        eventType:"page_view",
        path:t,
        referrer:r,
        userAgent:u
      })],{type:"application/json"})
    );
  }catch(e){}
})();`.trim();
}

export function AnalyticsScript({ projectId }: AnalyticsScriptProps) {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: buildTrackingScript(projectId) }}
      defer
    />
  );
}
