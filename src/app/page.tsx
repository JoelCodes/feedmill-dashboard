import DashboardLayout from '@/components/DashboardLayout';

export default function HomePage() {
  return (
    <DashboardLayout>
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Coming Soon
          </h1>
          <p className="text-text-secondary mt-2 text-sm">
            Production features launching soon.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
