import { describe, it, expect, vi, beforeEach } from "vitest";
import { getConfiguredChannels } from "../slackTelegramAlerts";

describe("Slack/Telegram Alerts", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  
  describe("getConfiguredChannels", () => {
    it("should return configured channels status", () => {
      const channels = getConfiguredChannels();
      
      expect(channels).toHaveProperty("email");
      expect(channels).toHaveProperty("slack");
      expect(channels).toHaveProperty("telegram");
      
      expect(typeof channels.email).toBe("boolean");
      expect(typeof channels.slack).toBe("boolean");
      expect(typeof channels.telegram).toBe("boolean");
    });
    
    it("should detect email configuration from ADMIN_ALERT_EMAIL", () => {
      const channels = getConfiguredChannels();
      
      // ADMIN_ALERT_EMAIL was configured by user
      if (process.env.ADMIN_ALERT_EMAIL) {
        expect(channels.email).toBe(true);
      }
    });
    
    it("should detect Slack configuration from SLACK_WEBHOOK_URL", () => {
      const channels = getConfiguredChannels();
      
      // SLACK_WEBHOOK_URL was configured by user
      if (process.env.SLACK_WEBHOOK_URL) {
        expect(channels.slack).toBe(true);
      }
    });
    
    it("should detect Telegram configuration from both TOKEN and CHAT_ID", () => {
      const channels = getConfiguredChannels();
      
      // Both TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        expect(channels.telegram).toBe(true);
      }
    });
  });
});
