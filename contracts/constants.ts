export const Session = {
  cookieName: "kimi_sid",
  emailCookieName: "qc_email",
  maxAgeMs: 365 * 24 * 60 * 60 * 1000,
} as const;

export const ErrorMessages = {
  unauthenticated: "Authentication required",
  insufficientRole: "Insufficient permissions",
} as const;

export const Paths = {
  login: "/login",
  oauthCallback: "/api/oauth/callback",
} as const;

// Predefined trade/service categories
export const TRADE_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Painting & Decorating",
  "Roofing",
  "HVAC",
  "Landscaping",
  "Tiling",
  "Flooring",
  "Kitchen Fitting",
  "Bathroom Fitting",
  "General Building",
  "Plastering",
  "Bricklaying",
  "Fencing",
  "Handyman Services",
  "Cleaning Services",
  "Pest Control",
  "Locksmith",
  "Window & Door Fitting",
  "Scaffolding",
  "Waste Removal",
  "Conservatory",
  "Loft Conversion",
  "Extensions",
  "Driveways",
  "Garage Conversion",
  "Damp Proofing",
  "Insulation",
  "Solar Panel Installation",
  "Security Systems",
  "Bespoke Furniture",
  "Welding & Metalwork",
  "Signwriting",
  "Other",
] as const;
