import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateJobApplicationEmail,
  generateContactFormEmail,
  EMAIL_CONFIG,
} from "../email";

describe("Email Service", () => {
  describe("generateJobApplicationEmail", () => {
    it("should generate email with all fields", () => {
      const data = {
        applicantName: "Nguyễn Văn A",
        applicantEmail: "nguyenvana@example.com",
        applicantPhone: "0901234567",
        jobTitle: "Kỹ sư Cơ khí",
        coverLetter: "Tôi rất quan tâm đến vị trí này...",
        cvUrl: "https://example.com/cv.pdf",
      };

      const result = generateJobApplicationEmail(data);

      expect(result.subject).toContain("Đơn ứng tuyển mới");
      expect(result.subject).toContain(data.jobTitle);
      expect(result.subject).toContain(data.applicantName);
      expect(result.html).toContain(data.applicantName);
      expect(result.html).toContain(data.applicantEmail);
      expect(result.html).toContain(data.applicantPhone);
      expect(result.html).toContain(data.coverLetter);
      expect(result.html).toContain(data.cvUrl);
      expect(result.text).toContain(data.applicantName);
    });

    it("should generate email without optional fields", () => {
      const data = {
        applicantName: "Trần Thị B",
        applicantEmail: "tranthib@example.com",
        jobTitle: "Nhân viên Kinh doanh",
      };

      const result = generateJobApplicationEmail(data);

      expect(result.subject).toContain(data.applicantName);
      expect(result.html).toContain(data.applicantName);
      expect(result.html).toContain(data.applicantEmail);
      expect(result.html).not.toContain("undefined");
    });

    it("should include proper HTML structure", () => {
      const data = {
        applicantName: "Test User",
        applicantEmail: "test@example.com",
        jobTitle: "Test Position",
      };

      const result = generateJobApplicationEmail(data);

      expect(result.html).toContain("<!DOCTYPE html>");
      expect(result.html).toContain("<html>");
      expect(result.html).toContain("</html>");
      expect(result.html).toContain("Dreamweldtech");
    });
  });

  describe("generateContactFormEmail", () => {
    it("should generate email with all fields", () => {
      const data = {
        name: "Công ty ABC",
        email: "abc@company.com",
        phone: "0281234567",
        company: "ABC Corporation",
        subject: "Yêu cầu báo giá máy hàn laser",
        message: "Chúng tôi cần báo giá cho 5 máy hàn laser...",
      };

      const result = generateContactFormEmail(data);

      expect(result.subject).toContain("Liên hệ mới");
      expect(result.subject).toContain(data.subject);
      expect(result.html).toContain(data.name);
      expect(result.html).toContain(data.email);
      expect(result.html).toContain(data.phone);
      expect(result.html).toContain(data.company);
      expect(result.html).toContain(data.message);
      expect(result.text).toContain(data.name);
    });

    it("should generate email without optional fields", () => {
      const data = {
        name: "Khách hàng",
        email: "customer@example.com",
        message: "Tôi cần tư vấn về sản phẩm",
      };

      const result = generateContactFormEmail(data);

      expect(result.subject).toContain(data.name);
      expect(result.html).toContain(data.name);
      expect(result.html).toContain(data.email);
      expect(result.html).toContain(data.message);
    });

    it("should include reply button with correct mailto link", () => {
      const data = {
        name: "Test",
        email: "test@example.com",
        subject: "Test Subject",
        message: "Test message",
      };

      const result = generateContactFormEmail(data);

      expect(result.html).toContain(`mailto:${data.email}`);
      expect(result.html).toContain("Trả lời email");
    });

    it("should handle newlines in message", () => {
      const data = {
        name: "Test",
        email: "test@example.com",
        message: "Line 1\nLine 2\nLine 3",
      };

      const result = generateContactFormEmail(data);

      expect(result.html).toContain("<br>");
    });
  });

  describe("EMAIL_CONFIG", () => {
    it("should have default configuration", () => {
      expect(EMAIL_CONFIG.from).toBeDefined();
      expect(EMAIL_CONFIG.adminEmail).toBeDefined();
      expect(EMAIL_CONFIG.companyName).toBe("Dreamweldtech");
    });
  });
});
