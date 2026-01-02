import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PrivacyPolicy() {
  const { language } = useLanguage();

  useEffect(() => {
    document.title = language === "vi" 
      ? "Chính Sách Bảo Mật | Dreamweldtech"
      : "Privacy Policy | Dreamweldtech";
  }, [language]);

  const content = {
    vi: {
      title: "Chính Sách Bảo Mật",
      lastUpdated: "Cập nhật lần cuối: 01/01/2026",
      sections: [
        {
          title: "1. Giới thiệu",
          content: `Dreamweldtech ("chúng tôi", "của chúng tôi") cam kết bảo vệ quyền riêng tư của bạn. Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng, tiết lộ và bảo vệ thông tin cá nhân của bạn khi bạn truy cập website hoặc sử dụng dịch vụ của chúng tôi.`
        },
        {
          title: "2. Thông tin chúng tôi thu thập",
          content: `Chúng tôi có thể thu thập các loại thông tin sau:

**Thông tin cá nhân bạn cung cấp:**
- Họ tên, địa chỉ email, số điện thoại
- Thông tin công ty và chức vụ
- Nội dung tin nhắn và yêu cầu liên hệ
- CV và thông tin ứng tuyển

**Thông tin tự động thu thập:**
- Địa chỉ IP và thông tin thiết bị
- Loại trình duyệt và hệ điều hành
- Trang web bạn truy cập trước và sau khi đến website của chúng tôi
- Thời gian và thời lượng truy cập`
        },
        {
          title: "3. Mục đích sử dụng thông tin",
          content: `Chúng tôi sử dụng thông tin thu thập được để:

- Cung cấp và cải thiện dịch vụ của chúng tôi
- Xử lý yêu cầu báo giá và liên hệ của bạn
- Gửi thông tin về sản phẩm, dịch vụ và khuyến mãi
- Xử lý đơn ứng tuyển việc làm
- Phân tích và cải thiện trải nghiệm người dùng
- Tuân thủ các nghĩa vụ pháp lý`
        },
        {
          title: "4. Chia sẻ thông tin",
          content: `Chúng tôi không bán hoặc cho thuê thông tin cá nhân của bạn cho bên thứ ba. Chúng tôi chỉ chia sẻ thông tin trong các trường hợp sau:

- Với sự đồng ý của bạn
- Với các nhà cung cấp dịch vụ hỗ trợ hoạt động kinh doanh của chúng tôi
- Khi được yêu cầu bởi pháp luật hoặc cơ quan có thẩm quyền
- Để bảo vệ quyền lợi hợp pháp của chúng tôi`
        },
        {
          title: "5. Bảo mật thông tin",
          content: `Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức phù hợp để bảo vệ thông tin cá nhân của bạn khỏi truy cập trái phép, mất mát, phá hủy hoặc thay đổi. Các biện pháp bao gồm:

- Mã hóa SSL/TLS cho tất cả các kết nối
- Kiểm soát truy cập và xác thực người dùng
- Giám sát và ghi nhật ký hoạt động
- Sao lưu dữ liệu định kỳ`
        },
        {
          title: "6. Quyền của bạn",
          content: `Bạn có quyền:

- Truy cập và nhận bản sao thông tin cá nhân của bạn
- Yêu cầu chỉnh sửa thông tin không chính xác
- Yêu cầu xóa thông tin cá nhân
- Phản đối việc xử lý thông tin
- Rút lại sự đồng ý đã cung cấp
- Khiếu nại với cơ quan bảo vệ dữ liệu`
        },
        {
          title: "7. Cookie và công nghệ theo dõi",
          content: `Website của chúng tôi sử dụng cookie và các công nghệ tương tự để:

- Ghi nhớ tùy chọn của bạn
- Phân tích lưu lượng truy cập
- Cải thiện trải nghiệm người dùng

Bạn có thể quản lý cài đặt cookie trong trình duyệt của mình.`
        },
        {
          title: "8. Liên kết bên ngoài",
          content: `Website của chúng tôi có thể chứa liên kết đến các trang web của bên thứ ba. Chúng tôi không chịu trách nhiệm về chính sách bảo mật hoặc nội dung của các trang web này.`
        },
        {
          title: "9. Thay đổi chính sách",
          content: `Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian. Mọi thay đổi sẽ được đăng trên trang này với ngày cập nhật mới. Chúng tôi khuyến khích bạn xem lại chính sách này định kỳ.`
        },
        {
          title: "10. Liên hệ",
          content: `Nếu bạn có bất kỳ câu hỏi nào về chính sách bảo mật này, vui lòng liên hệ:

**Dreamweldtech**
Địa chỉ: Khu Công Nghệ Cao, Quận 9, TP. Hồ Chí Minh, Việt Nam
Email: privacy@dreamweldtech.com
Điện thoại: +84 123 456 789`
        }
      ]
    },
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last updated: January 1, 2026",
      sections: [
        {
          title: "1. Introduction",
          content: `Dreamweldtech ("we", "our", "us") is committed to protecting your privacy. This privacy policy explains how we collect, use, disclose, and protect your personal information when you visit our website or use our services.`
        },
        {
          title: "2. Information We Collect",
          content: `We may collect the following types of information:

**Personal information you provide:**
- Name, email address, phone number
- Company information and job title
- Message content and contact requests
- CV and job application information

**Automatically collected information:**
- IP address and device information
- Browser type and operating system
- Websites visited before and after our website
- Access time and duration`
        },
        {
          title: "3. How We Use Information",
          content: `We use the collected information to:

- Provide and improve our services
- Process your quote requests and inquiries
- Send information about products, services, and promotions
- Process job applications
- Analyze and improve user experience
- Comply with legal obligations`
        },
        {
          title: "4. Information Sharing",
          content: `We do not sell or rent your personal information to third parties. We only share information in the following cases:

- With your consent
- With service providers supporting our business operations
- When required by law or competent authorities
- To protect our legitimate interests`
        },
        {
          title: "5. Information Security",
          content: `We implement appropriate technical and organizational security measures to protect your personal information from unauthorized access, loss, destruction, or alteration. Measures include:

- SSL/TLS encryption for all connections
- Access control and user authentication
- Activity monitoring and logging
- Regular data backups`
        },
        {
          title: "6. Your Rights",
          content: `You have the right to:

- Access and receive a copy of your personal information
- Request correction of inaccurate information
- Request deletion of personal information
- Object to information processing
- Withdraw previously given consent
- File a complaint with data protection authorities`
        },
        {
          title: "7. Cookies and Tracking Technologies",
          content: `Our website uses cookies and similar technologies to:

- Remember your preferences
- Analyze traffic
- Improve user experience

You can manage cookie settings in your browser.`
        },
        {
          title: "8. External Links",
          content: `Our website may contain links to third-party websites. We are not responsible for the privacy policies or content of these websites.`
        },
        {
          title: "9. Policy Changes",
          content: `We may update this privacy policy from time to time. Any changes will be posted on this page with a new update date. We encourage you to review this policy periodically.`
        },
        {
          title: "10. Contact Us",
          content: `If you have any questions about this privacy policy, please contact:

**Dreamweldtech**
Address: High-Tech Park, District 9, Ho Chi Minh City, Vietnam
Email: privacy@dreamweldtech.com
Phone: +84 123 456 789`
        }
      ]
    }
  };

  const t = content[language as keyof typeof content] || content.vi;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center">
            {t.title}
          </h1>
          <p className="text-slate-400 text-center mt-4">{t.lastUpdated}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <div className="bg-card rounded-xl shadow-lg p-8 md:p-12 space-y-8">
            {t.sections.map((section, index) => (
              <div key={index} className="space-y-4">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">
                  {section.title}
                </h2>
                <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {section.content.split("**").map((part, i) => 
                    i % 2 === 1 ? <strong key={i} className="text-foreground">{part}</strong> : part
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
