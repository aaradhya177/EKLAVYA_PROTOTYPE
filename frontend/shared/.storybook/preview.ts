import type { Preview } from "@storybook/react";
import React from "react";

import { colors } from "../tokens";

const preview: Preview = {
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Global theme mode",
      defaultValue: "light",
      toolbar: {
        icon: "contrast",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" }
        ]
      }
    }
  },
  decorators: [
    (Story, context) => {
      const dark = context.globals.theme === "dark";
      return (
        <div
          style={{
            minHeight: "100vh",
            padding: 24,
            background: dark ? colors.gray[900] : colors.gray[50],
            color: dark ? colors.white : colors.gray[900]
          }}
        >
          <Story />
        </div>
      );
    }
  ]
};

export default preview;
