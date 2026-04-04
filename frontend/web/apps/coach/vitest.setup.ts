import "@testing-library/jest-dom";

import { vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn()
  }),
  usePathname: () => "/athletes"
}));

vi.mock("react-beautiful-dnd", () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => children,
  Droppable: ({ children }: { children: (provided: { innerRef: () => void; droppableProps: Record<string, unknown>; placeholder: null }) => React.ReactNode }) =>
    children({ innerRef: () => undefined, droppableProps: {}, placeholder: null }),
  Draggable: ({
    children
  }: {
    children: (provided: { innerRef: () => void; draggableProps: Record<string, unknown>; dragHandleProps: Record<string, unknown> }) => React.ReactNode;
  }) => children({ innerRef: () => undefined, draggableProps: {}, dragHandleProps: {} })
}));

class MockNotification {
  static permission = "granted";
  constructor(_title: string, _options?: NotificationOptions) {}
  static requestPermission = vi.fn(async () => "granted");
}

Object.defineProperty(window, "Notification", {
  value: MockNotification,
  writable: true
});
