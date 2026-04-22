"use client";

import React from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy redirect: /admin/clients/[id]/sites now redirects to
 * the new tabbed client detail page at /admin/clients/[id]
 * The Sites tab (#sites) is the second tab.
 */
export default function LegacySitesRedirect({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);

  React.useEffect(() => {
    router.replace(`/admin/clients/${id}`);
  }, [id, router]);

  return (
    <div className="p-8 text-center text-zinc-500 text-sm">
      Redirecting to client detail...
    </div>
  );
}
