import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { Modal } from "../components/index.web";

const meta = {
  title: "Foundation/Overlays",
  component: Modal
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultModal: Story = {
  args: {
    open: true,
    title: "Athlete Detail",
    onClose: () => undefined,
    children: <p style={{ margin: 0 }}>This shared modal powers approval and detail flows on the web apps.</p>
  }
};
