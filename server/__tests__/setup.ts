/**
 * Global test setup file
 * Runs before all tests to configure the test environment
 */

import { vi } from "vitest";

// Mock environment variables for tests
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key-for-testing-only";
process.env.OWNER_OPEN_ID = "test-owner-id";
process.env.VITE_APP_ID = "friday-ai-test";

// Mock external API keys (tests should never hit real APIs)
process.env.OPENAI_API_KEY = "test-openai-key";
process.env.GEMINI_API_KEY = "test-gemini-key";
process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
process.env.BILLY_API_KEY = "test-billy-key";
process.env.BILLY_ORGANIZATION_ID = "test-org-id";

// Mock Google credentials
process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify({
  type: "service_account",
  project_id: "test-project",
  private_key: "test-key",
  client_email: "test@test.iam.gserviceaccount.com",
});
process.env.GOOGLE_IMPERSONATED_USER = "test@rendetalje.dk";
process.env.GOOGLE_CALENDAR_ID = "test-calendar-id";

// Configure global test timeout
vi.setConfig({ testTimeout: 10000 });

// Global test hooks
beforeAll(() => {
  console.log("🧪 Starting test suite...");
});

afterAll(() => {
  console.log("✅ Test suite complete!");
});

// Reset all mocks between tests
afterEach(() => {
  vi.clearAllMocks();
});
