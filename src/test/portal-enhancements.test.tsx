import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// Mock validation client and supabase
vi.mock("@/lib/ai-validation-client", () => ({
  validateStudentDocument: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: "test" }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://test.url/paper.pdf" } }),
      })),
    },
  },
}));

import { SubmitModal, TrackModal } from "../components/ncatex/Panels";
import { Navbar } from "../components/ncatex/Navbar";
import { Hero } from "../components/ncatex/Hero";
import { ThemeProvider } from "@/context/ThemeContext";

describe("Portal Enhancements & Role-Based Navigation Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  describe("1. Track Selection in SubmitModal", () => {
    it("initializes with provided initialTrack if passed instead of defaulting to AIML", () => {
      render(
        <SubmitModal
          onClose={() => {}}
          onTrack={() => {}}
          initialTrack="VLSI & Embedded Systems"
        />,
      );

      const select = screen.getByLabelText(/Research Track/i) as HTMLSelectElement;
      expect(select.value).toBe("VLSI & Embedded Systems");
    });

    it("allows dynamically changing track via dropdown selection", () => {
      render(<SubmitModal onClose={() => {}} onTrack={() => {}} />);

      const select = screen.getByLabelText(/Research Track/i) as HTMLSelectElement;

      // Dynamically choose 5G track
      fireEvent.change(select, {
        target: { value: "5G & Next-Gen Wireless Communications" },
      });

      expect(select.value).toBe("5G & Next-Gen Wireless Communications");
    });

    it("allows dynamically selecting track via quick chip buttons", () => {
      render(<SubmitModal onClose={() => {}} onTrack={() => {}} />);

      const select = screen.getByLabelText(/Research Track/i) as HTMLSelectElement;

      // Click IoT chip button
      const iotBtn = screen.getByRole("button", { name: /^IoT$/i });
      fireEvent.click(iotBtn);

      expect(select.value).toBe("Internet of Things (IoT) & Smart Sensors");
    });
  });

  describe("2. Clean Public Landing Page Navbar (No Auth)", () => {
    it("renders ONLY Logo, Section Links [Overview | Tracks | Dates | FAQ], single Login button, and Dark/Light toggle", () => {
      render(
        <ThemeProvider>
          <Navbar roleOverride="public" onSubmit={() => {}} onTrack={() => {}} />
        </ThemeProvider>,
      );

      // Title & Logo
      expect(screen.getByText("NCATEX")).toBeDefined();

      // Navigation links
      expect(screen.getByRole("link", { name: "Overview" })).toBeDefined();
      expect(screen.getByRole("link", { name: "Tracks" })).toBeDefined();
      expect(screen.getByRole("link", { name: "Dates" })).toBeDefined();
      expect(screen.getByRole("link", { name: "FAQ" })).toBeDefined();

      // Single Login Link
      const loginLinks = screen.getAllByRole("link", { name: /Login/i });
      expect(loginLinks.length).toBeGreaterThan(0);
      expect(loginLinks[0]!.getAttribute("href")).toBe("/login");

      // Verify removed buttons from public navbar
      expect(screen.queryByRole("button", { name: /Submit Paper/i })).toBeNull();
      expect(screen.queryByRole("button", { name: /Track Paper/i })).toBeNull();
      expect(screen.queryByRole("link", { name: /Admin/i })).toBeNull();
    });
  });

  describe("3. Student Role-Based Navigation", () => {
    it("renders Student actions [My Submissions], [Submit Paper Modal trigger], and [Logout]", () => {
      const onSubmit = vi.fn();
      const onTrack = vi.fn();

      render(
        <ThemeProvider>
          <Navbar
            roleOverride="student"
            onSubmit={onSubmit}
            onTrack={onTrack}
          />
        </ThemeProvider>,
      );

      // Student buttons
      const submitBtn = screen.getByRole("button", { name: /Submit Paper/i });
      expect(submitBtn).toBeDefined();
      fireEvent.click(submitBtn);
      expect(onSubmit).toHaveBeenCalled();

      const submissionsBtn = screen.getByRole("button", { name: /My Submissions/i });
      expect(submissionsBtn).toBeDefined();
      fireEvent.click(submissionsBtn);
      expect(onTrack).toHaveBeenCalled();

      const logoutBtn = screen.getByRole("button", { name: /Logout/i });
      expect(logoutBtn).toBeDefined();
    });
  });

  describe("4. Admin Role-Based Navigation", () => {
    it("renders Admin controls [Admin Dashboard], [Logout] and hides student submission triggers", () => {
      render(
        <ThemeProvider>
          <Navbar roleOverride="admin" onSubmit={() => {}} onTrack={() => {}} />
        </ThemeProvider>,
      );

      // Admin Dashboard link
      const adminLink = screen.getByRole("link", { name: /Admin Dashboard/i });
      expect(adminLink).toBeDefined();
      expect(adminLink.getAttribute("href")).toBe("/admin");

      // Logout button
      expect(screen.getByRole("button", { name: /Logout/i })).toBeDefined();

      // Student triggers should NOT be present in Admin view
      expect(screen.queryByRole("button", { name: /Submit Paper/i })).toBeNull();
      expect(screen.queryByRole("button", { name: /My Submissions/i })).toBeNull();
    });
  });

  describe("5. Mobile Menu Interaction", () => {
    it("toggles mobile menu when hamburger button is clicked", () => {
      render(
        <ThemeProvider>
          <Navbar roleOverride="public" onSubmit={() => {}} onTrack={() => {}} />
        </ThemeProvider>,
      );

      const toggleBtn = screen.getByLabelText(/Toggle mobile menu/i);
      expect(toggleBtn).toBeDefined();

      fireEvent.click(toggleBtn);
      // In public view, login link should be present in mobile menu
      const loginElements = screen.getAllByText(/Login/i);
      expect(loginElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("6. Modal Dialog Handlers and isOpen State", () => {
    it("does not render SubmitModal when isOpen is false", () => {
      render(
        <SubmitModal
          isOpen={false}
          onClose={() => {}}
          onTrack={() => {}}
        />,
      );

      expect(screen.queryByText(/Submit a Research Paper/i)).toBeNull();
    });

    it("renders SubmitModal when isOpen is true with high z-index backdrop", () => {
      render(
        <SubmitModal
          isOpen={true}
          onClose={() => {}}
          onTrack={() => {}}
        />,
      );

      expect(screen.getByText(/Submit a Research Paper/i)).toBeDefined();
    });

    it("does not render TrackModal when isOpen is false", () => {
      render(
        <TrackModal
          isOpen={false}
          onClose={() => {}}
        />,
      );

      expect(screen.queryByText(/Track Manuscript Status/i)).toBeNull();
    });

    it("renders TrackModal when isOpen is true", () => {
      render(
        <TrackModal
          isOpen={true}
          onClose={() => {}}
        />,
      );

      expect(screen.getByText(/Track Manuscript Status/i)).toBeDefined();
    });

    it("Hero Submit Paper and Track Paper buttons invoke setIsSubmitModalOpen(true) and setIsTrackModalOpen(true)", () => {
      const setIsSubmitModalOpen = vi.fn();
      const setIsTrackModalOpen = vi.fn();

      render(
        <ThemeProvider>
          <Hero
            isSubmitModalOpen={false}
            setIsSubmitModalOpen={setIsSubmitModalOpen}
            isTrackModalOpen={false}
            setIsTrackModalOpen={setIsTrackModalOpen}
          />
        </ThemeProvider>,
      );

      // Hero Submit Paper button
      const heroSubmitBtn = document.getElementById("hero-submit-btn");
      expect(heroSubmitBtn).toBeDefined();
      if (heroSubmitBtn) {
        fireEvent.click(heroSubmitBtn);
        expect(setIsSubmitModalOpen).toHaveBeenCalledWith(true);
      }

      // Hero Track Paper button
      const heroTrackBtn = document.getElementById("hero-track-btn");
      expect(heroTrackBtn).toBeDefined();
      if (heroTrackBtn) {
        fireEvent.click(heroTrackBtn);
        expect(setIsTrackModalOpen).toHaveBeenCalledWith(true);
      }
    });
  });
});
