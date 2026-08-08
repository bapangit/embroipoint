"use client";

import { useSession } from "next-auth/react";

type AdminOrderBadgeProps = {
  className: string;
  count?: number;
};

export default function AdminOrderBadge({
  className,
  count = 0,
}: AdminOrderBadgeProps) {
  const { data: session } = useSession();

  if (session?.user?.role !== "admin") {
    return null;
  }

  return <span className={className}>{count} orders</span>;
}
