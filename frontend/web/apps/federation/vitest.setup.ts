import "@testing-library/jest-dom";

import { vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace
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

vi.mock("react-simple-maps", () => ({
  ComposableMap: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Geographies: ({
    children
  }: {
    children: (value: { geographies: Array<{ rsmKey: string }> }) => React.ReactNode;
  }) => children({ geographies: [{ rsmKey: "geo-1" }, { rsmKey: "geo-2" }, { rsmKey: "geo-3" }] }),
  Geography: ({ onClick }: { onClick?: () => void }) => <button onClick={onClick}>State</button>
}));

export { mockReplace };
