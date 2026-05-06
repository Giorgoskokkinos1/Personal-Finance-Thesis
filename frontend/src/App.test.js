import { render, screen } from "@testing-library/react";

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: [] })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

jest.mock(
  "react-router-dom",
  () => {
    const React = require("react");

    return {
      BrowserRouter: ({ children }) => <div>{children}</div>,
      Routes: ({ children }) => <div>{children}</div>,
      Route: ({ path, element }) => (path === "/" ? element : null),
      Link: ({ children, to, ...props }) => (
        <a href={to} {...props}>
          {children}
        </a>
      ),
      NavLink: ({ children, to, className, ...props }) => (
        <a
          href={to}
          className={
            typeof className === "function" ? className({ isActive: false }) : className
          }
          {...props}
        >
          {children}
        </a>
      ),
    };
  },
  { virtual: true }
);

test("starts on the login screen", async () => {
  window.localStorage.setItem(
    "financeTrackerUser",
    JSON.stringify({
      email: "demo@example.com",
      name: "demo",
      signedInAt: new Date().toISOString(),
    })
  );

  const App = require("./App").default;

  render(<App />);
  expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Enter password")).toBeInTheDocument();

  window.localStorage.removeItem("financeTrackerUser");
});
