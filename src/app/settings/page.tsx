"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  UserPreferences,
  defaultPreferences,
} from "@/types/settings";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function SettingsPage() {
  const [savedPreferences, setSavedPreferences] = useLocalStorage<UserPreferences>(
    "user-preferences",
    defaultPreferences
  );
  const [formState, setFormState] = useState<UserPreferences>(savedPreferences);

  // Only track density changes since theme is managed by ThemeToggle via next-themes
  const hasChanges = formState.density !== savedPreferences.density ||
    JSON.stringify(formState.notifications) !== JSON.stringify(savedPreferences.notifications);

  const updateNotificationSetting = (
    key: keyof UserPreferences["notifications"],
    value: boolean
  ) => {
    setFormState((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));
  };

  const updateDensity = (value: "comfortable" | "compact") => {
    setFormState((prev) => ({
      ...prev,
      density: value,
    }));
  };

  const handleSave = () => {
    setSavedPreferences(formState);
  };

  return (
    <div className="flex h-screen bg-bg-page">
      <Sidebar />
      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 pr-8">
        <Header />

        <div className="mx-auto w-full max-w-2xl">
          {/* Notification Preferences Section */}
          <section className="mb-6">
            <h2 className="mb-4 text-lg font-bold">Notification Preferences</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formState.notifications.orderStatus}
                  onChange={(e) =>
                    updateNotificationSetting("orderStatus", e.target.checked)
                  }
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                <span className="text-sm">Order Status Updates</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formState.notifications.alerts}
                  onChange={(e) =>
                    updateNotificationSetting("alerts", e.target.checked)
                  }
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                <span className="text-sm">Alerts</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formState.notifications.system}
                  onChange={(e) =>
                    updateNotificationSetting("system", e.target.checked)
                  }
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                <span className="text-sm">System Messages</span>
              </label>
            </div>
          </section>

          {/* Display Settings Section */}
          <section className="mb-6">
            <h2 className="mb-4 text-lg font-bold">Display Settings</h2>
            <div className="space-y-4">
              <div>
                <span className="mb-2 block text-sm font-bold">Theme</span>
                <ThemeToggle />
              </div>

              <Select
                label="Display Density"
                options={[
                  { value: "comfortable", label: "Comfortable" },
                  { value: "compact", label: "Compact" },
                ]}
                value={formState.density}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "comfortable" || value === "compact") {
                    updateDensity(value);
                  }
                }}
              />
            </div>
          </section>

          {/* Save Button */}
          <Button
            variant="primary"
            disabled={!hasChanges}
            onClick={handleSave}
          >
            Save Preferences
          </Button>
        </div>
      </main>
    </div>
  );
}
