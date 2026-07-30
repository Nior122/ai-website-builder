// =============================================================================
// /docs — API Documentation (Swagger UI)
// =============================================================================

'use client';

import { useEffect, useRef } from 'react';

export default function DocsPage() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Swagger UI CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui.css';
    document.head.appendChild(link);

    // Load Swagger UI JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-bundle.js';
    script.onload = () => {
      fetch('/api/docs')
        .then((res) => res.json())
        .then((spec) => {
          // @ts-expect-error — SwaggerUIBundle is injected by the script tag, untyped on window
          window.SwaggerUIBundle({
            spec,
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              // @ts-expect-error — see above
              window.SwaggerUIBundle.presets.apis,
              // @ts-expect-error — see above
              window.SwaggerUIBundle.SwaggerUIStandalonePreset,
            ],
            layout: 'BaseLayout',
          });
        });
    };
    document.body.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <div id="swagger-ui" ref={ref} />
    </div>
  );
}
