import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), refresh: mockRefresh }),
  usePathname: () => "/onboarding",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock appStore
vi.mock("@/store/appStore", () => ({
  useAppStore: (selector: (s: { setOnboarding: (v: boolean) => void }) => unknown) =>
    selector({ setOnboarding: vi.fn() }),
}));

// Mock framer-motion to avoid animation issues in jsdom
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement> & { children?: React.ReactNode }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock fetch globally
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({}),
});
global.fetch = mockFetch;

// supabase client is aliased to mock → mockClientSupabase

describe("OnboardingFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  it("renders name input on step 0", () => {
    render(<OnboardingFlow initialName="" />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  it("Continue button advances from step 0 to step 1", async () => {
    render(<OnboardingFlow initialName="" />);
    await userEvent.click(screen.getByText("Continue"));
    // Step 1 renders gender selector with "About you" heading
    await waitFor(() => {
      expect(screen.getByText("About you")).toBeInTheDocument();
    });
  });

  it("step 1 renders gender selector with Skip/Continue button", async () => {
    render(<OnboardingFlow initialName="" />);
    await userEvent.click(screen.getByText("Continue"));
    await waitFor(() => expect(screen.getByText("About you")).toBeInTheDocument());
    // Without selecting gender, button should say "Skip"
    expect(screen.getByText("Skip")).toBeInTheDocument();
  });

  it("Skip on step 1 advances to step 2 (body metrics)", async () => {
    render(<OnboardingFlow initialName="" />);
    await userEvent.click(screen.getByText("Continue"));
    await waitFor(() => expect(screen.getByText("About you")).toBeInTheDocument());
    await userEvent.click(screen.getByText("Skip"));
    await waitFor(() => {
      expect(screen.getByText("Body metrics")).toBeInTheDocument();
    });
  });

  it("step 3 shows goal selection", async () => {
    render(<OnboardingFlow initialName="" />);
    // Navigate through steps 0 → 1 → 2 → 3
    await userEvent.click(screen.getByText("Continue"));
    await waitFor(() => expect(screen.getByText("About you")).toBeInTheDocument());
    await userEvent.click(screen.getByText("Skip"));
    await waitFor(() => expect(screen.getByText("Body metrics")).toBeInTheDocument());
    await userEvent.click(screen.getByText("Continue"));
    await waitFor(() => {
      expect(screen.getByText(/what.*s your goal/i)).toBeInTheDocument();
    });
  });

  it("finish calls PUT /api/user/profile", async () => {
    render(<OnboardingFlow initialName="Alice" />);
    // Navigate to step 3
    await userEvent.click(screen.getByText("Continue"));
    await waitFor(() => expect(screen.getByText("About you")).toBeInTheDocument());
    await userEvent.click(screen.getByText("Skip"));
    await waitFor(() => expect(screen.getByText("Body metrics")).toBeInTheDocument());
    await userEvent.click(screen.getByText("Continue"));
    await waitFor(() => expect(screen.getByText(/what.*s your goal/i)).toBeInTheDocument());
    await userEvent.click(screen.getByText("Get started"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/user/profile",
        expect.objectContaining({ method: "PUT" })
      );
    });
  });

  it("shows 4 step dots", () => {
    const { container } = render(<OnboardingFlow initialName="" />);
    // StepDots renders 4 dots
    const dots = container.querySelectorAll(".rounded-full.w-2.h-2");
    expect(dots.length).toBe(4);
  });
});
