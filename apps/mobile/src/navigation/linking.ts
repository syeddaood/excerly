export const linking = {
  prefixes: ["dawnlock://", "exp://"],
  config: {
    screens: {
      ring: "ring",
      index: "",
      alarms: {
        path: "alarms",
        screens: {
          index: "",
          new: "new",
          "[id]": {
            path: ":id",
            screens: {
              edit: "edit",
            },
          },
        },
      },
    },
  },
};
