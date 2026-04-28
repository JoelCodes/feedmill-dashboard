"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  UserPreferences,
  defaultPreferences,
} from "@/types/settings";

export default function SettingsPage() {
  const [savedPreferences, setSavedPreferences] = useLocalStorage<UserPreferences>(
    "user-preferences",
    defaultPreferences
  );
  const [formState, setFormState] = useState<UserPreferences>(savedPreferences);

  const hasChanges = JSON.stringify(formState) !== JSON.stringify(savedPreferences);

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

  const updateTheme = (value: "light" | "dark") => {
    setFormState((prev) => ({
      ...prev,
      theme: value,
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
                  className="h-4 w-4"
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
                  className="h-4 w-4"
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
                  className="h-4 w-4"
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
                <label className="mb-2 block text-sm font-bold">Theme</label>
                <select
                  value={formState.theme}
                  onChange={(e) => updateTheme(e.target.value as "light" | "dark")}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Display Density</label>
                <select
                  value={formState.density}
                  onChange={(e) =>
                    updateDensity(e.target.value as "comfortable" | "compact")
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </select>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="rounded-lg bg-primary px-4 py-2 text-white disabled:opacity-50"
          >
            Save Preferences
          </button>
        </div>
      </main>
    </div>
  );
}
