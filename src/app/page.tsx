import { prisma } from "@/shared/lib/prisma";
import Dashboard from "@/features/dashboard/components/Dashboard";

export const dynamic = 'force-dynamic';

export default async function Home() {
  return (
    <div className="h-full">
      <Dashboard />
    </div>
  );
}