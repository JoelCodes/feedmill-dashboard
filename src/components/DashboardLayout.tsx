'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

/**
 * DashboardLayout provides consistent structure for all dashboard pages.
 *
 * Layout structure:
 * - Sidebar fixed on the left
 * - Main content area with Header at top and children below
 *
 * This eliminates layout duplication across dashboard pages (NAV-02)
 * and ensures consistent styling and spacing.
 */
interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="bg-bg-page flex h-screen">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
        <Header />
        {children}
      </main>
    </div>
  );
}
