export interface UserPreferences {
  theme: "light" | "dark";
  density: "comfortable" | "compact";
  notifications: {
    orderStatus: boolean;
    alerts: boolean;
    system: boolean;
  };
}

export const defaultPreferences: UserPreferences = {
  theme: "light",
  density: "comfortable",
  notifications: {
    orderStatus: true,
    alerts: true,
    system: true,
  },
};
