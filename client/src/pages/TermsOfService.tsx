import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TermsOfService() {
  const { language } = useLanguage();

  useEffect(() => {
    document.title = language === "vi" 
      ? "Điều Khoản Dịch Vụ | Dreamweldtech"
      : "Terms of Service | Dreamweldtech";
  }, [language]);

  const content = {
    vi: {
      title: "Điều Khoản Dịch Vụ",
      lastUpdated: "Cập nhật lần cuối: 01/01/2026",
      sections: [
        {
          title: "1. Chấp nhận điều khoản",
          content: `Bằng việc truy cập và sử dụng website Dreamweldtech, bạn đồng ý tuân thủ và chịu ràng buộc bởi các điều khoản và điều kiện này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng không sử dụng website của chúng tôi.`
        },
        {
          title: "2. Mô tả dịch vụ",
          content: `Dreamweldtech cung cấp:

- Thông tin về sản phẩm máy hàn laser, máy cắt laser và máy làm sạch laser
- Dịch vụ tư vấn và báo giá thiết bị công nghiệp
- Dịch vụ hỗ trợ kỹ thuật và bảo trì
- Đào tạo vận hành thiết bị
- Cung cấp phụ tùng và vật tư tiêu hao

Chúng tôi có quyền thay đổi, tạm ngừng hoặc ngừng cung cấp bất kỳ dịch vụ nào mà không cần thông báo trước.`
        },
        {
          title: "3. Tài khoản người dùng",
          content: `Khi tạo tài khoản trên website của chúng tôi, bạn đồng ý:

- Cung cấp thông tin chính xác, đầy đủ và cập nhật
- Bảo mật thông tin đăng nhập của bạn
- Chịu trách nhiệm cho tất cả hoạt động dưới tài khoản của bạn
- Thông báo ngay cho chúng tôi nếu phát hiện truy cập trái phép

Chúng tôi có quyền đình chỉ hoặc chấm dứt tài khoản nếu phát hiện vi phạm điều khoản.`
        },
        {
          title: "4. Sở hữu trí tuệ",
          content: `Tất cả nội dung trên website bao gồm nhưng không giới hạn:

- Logo, nhãn hiệu và tên thương mại
- Văn bản, hình ảnh, video và đồ họa
- Thiết kế và bố cục website
- Phần mềm và mã nguồn

đều thuộc sở hữu của Dreamweldtech hoặc các bên cấp phép. Bạn không được sao chép, phân phối, sửa đổi hoặc tạo tác phẩm phái sinh mà không có sự cho phép bằng văn bản.`
        },
        {
          title: "5. Sử dụng được phép",
          content: `Bạn đồng ý chỉ sử dụng website cho các mục đích hợp pháp và không:

- Vi phạm bất kỳ luật pháp hoặc quy định nào
- Xâm phạm quyền của người khác
- Truyền tải nội dung có hại, lừa đảo hoặc xúc phạm
- Cố gắng truy cập trái phép vào hệ thống
- Sử dụng robot, spider hoặc công cụ tự động khác
- Can thiệp vào hoạt động bình thường của website`
        },
        {
          title: "6. Đặt hàng và thanh toán",
          content: `Khi đặt hàng sản phẩm hoặc dịch vụ:

- Giá cả có thể thay đổi mà không cần thông báo trước
- Đơn hàng chỉ được xác nhận sau khi chúng tôi gửi email xác nhận
- Chúng tôi có quyền từ chối hoặc hủy đơn hàng vì bất kỳ lý do nào
- Thanh toán phải được thực hiện theo phương thức đã thỏa thuận
- Thuế và phí vận chuyển sẽ được tính riêng`
        },
        {
          title: "7. Bảo hành và hoàn trả",
          content: `Chính sách bảo hành và hoàn trả:

- Sản phẩm được bảo hành theo điều khoản của nhà sản xuất
- Thời gian bảo hành tùy thuộc vào từng sản phẩm cụ thể
- Bảo hành không áp dụng cho hư hỏng do sử dụng sai cách
- Yêu cầu hoàn trả phải được gửi trong vòng 7 ngày kể từ khi nhận hàng
- Sản phẩm hoàn trả phải còn nguyên vẹn và đầy đủ phụ kiện`
        },
        {
          title: "8. Giới hạn trách nhiệm",
          content: `Trong phạm vi pháp luật cho phép:

- Dreamweldtech không chịu trách nhiệm cho bất kỳ thiệt hại gián tiếp, ngẫu nhiên, đặc biệt hoặc hậu quả nào
- Trách nhiệm tối đa của chúng tôi không vượt quá số tiền bạn đã thanh toán cho sản phẩm/dịch vụ liên quan
- Chúng tôi không đảm bảo website hoạt động không gián đoạn hoặc không có lỗi
- Thông tin trên website chỉ mang tính tham khảo`
        },
        {
          title: "9. Bồi thường",
          content: `Bạn đồng ý bồi thường và giữ cho Dreamweldtech, các giám đốc, nhân viên và đối tác không bị thiệt hại từ bất kỳ khiếu nại, tổn thất, chi phí hoặc thiệt hại nào phát sinh từ:

- Việc bạn vi phạm các điều khoản này
- Việc bạn vi phạm quyền của bên thứ ba
- Việc bạn sử dụng website của chúng tôi`
        },
        {
          title: "10. Luật áp dụng",
          content: `Các điều khoản này được điều chỉnh và giải thích theo pháp luật Việt Nam. Mọi tranh chấp phát sinh sẽ được giải quyết tại tòa án có thẩm quyền tại TP. Hồ Chí Minh, Việt Nam.`
        },
        {
          title: "11. Thay đổi điều khoản",
          content: `Chúng tôi có quyền sửa đổi các điều khoản này bất cứ lúc nào. Các thay đổi sẽ có hiệu lực ngay khi được đăng trên website. Việc bạn tiếp tục sử dụng website sau khi thay đổi được đăng tải đồng nghĩa với việc bạn chấp nhận các điều khoản mới.`
        },
        {
          title: "12. Liên hệ",
          content: `Nếu bạn có bất kỳ câu hỏi nào về các điều khoản này, vui lòng liên hệ:

**Dreamweldtech**
Địa chỉ: Khu Công Nghệ Cao, Quận 9, TP. Hồ Chí Minh, Việt Nam
Email: legal@dreamweldtech.com
Điện thoại: +84 123 456 789`
        }
      ]
    },
    en: {
      title: "Terms of Service",
      lastUpdated: "Last updated: January 1, 2026",
      sections: [
        {
          title: "1. Acceptance of Terms",
          content: `By accessing and using the Dreamweldtech website, you agree to comply with and be bound by these terms and conditions. If you do not agree to any part of these terms, please do not use our website.`
        },
        {
          title: "2. Service Description",
          content: `Dreamweldtech provides:

- Information about laser welding machines, laser cutting machines, and laser cleaning machines
- Industrial equipment consultation and quotation services
- Technical support and maintenance services
- Equipment operation training
- Spare parts and consumables supply

We reserve the right to change, suspend, or discontinue any service without prior notice.`
        },
        {
          title: "3. User Accounts",
          content: `When creating an account on our website, you agree to:

- Provide accurate, complete, and up-to-date information
- Keep your login credentials secure
- Be responsible for all activities under your account
- Notify us immediately if you detect unauthorized access

We reserve the right to suspend or terminate accounts if violations are detected.`
        },
        {
          title: "4. Intellectual Property",
          content: `All content on the website including but not limited to:

- Logos, trademarks, and trade names
- Text, images, videos, and graphics
- Website design and layout
- Software and source code

are owned by Dreamweldtech or its licensors. You may not copy, distribute, modify, or create derivative works without written permission.`
        },
        {
          title: "5. Permitted Use",
          content: `You agree to use the website only for lawful purposes and not to:

- Violate any laws or regulations
- Infringe on the rights of others
- Transmit harmful, fraudulent, or offensive content
- Attempt unauthorized access to systems
- Use robots, spiders, or other automated tools
- Interfere with normal website operations`
        },
        {
          title: "6. Orders and Payment",
          content: `When ordering products or services:

- Prices may change without prior notice
- Orders are only confirmed after we send a confirmation email
- We reserve the right to refuse or cancel orders for any reason
- Payment must be made according to the agreed method
- Taxes and shipping fees will be calculated separately`
        },
        {
          title: "7. Warranty and Returns",
          content: `Warranty and return policy:

- Products are warranted according to manufacturer terms
- Warranty period depends on specific products
- Warranty does not apply to damage from misuse
- Return requests must be submitted within 7 days of receipt
- Returned products must be intact with all accessories`
        },
        {
          title: "8. Limitation of Liability",
          content: `To the extent permitted by law:

- Dreamweldtech is not liable for any indirect, incidental, special, or consequential damages
- Our maximum liability does not exceed the amount you paid for the related product/service
- We do not guarantee uninterrupted or error-free website operation
- Information on the website is for reference only`
        },
        {
          title: "9. Indemnification",
          content: `You agree to indemnify and hold harmless Dreamweldtech, its directors, employees, and partners from any claims, losses, costs, or damages arising from:

- Your violation of these terms
- Your violation of third-party rights
- Your use of our website`
        },
        {
          title: "10. Governing Law",
          content: `These terms are governed by and construed in accordance with Vietnamese law. Any disputes arising will be resolved at competent courts in Ho Chi Minh City, Vietnam.`
        },
        {
          title: "11. Changes to Terms",
          content: `We reserve the right to modify these terms at any time. Changes will take effect immediately upon posting on the website. Your continued use of the website after changes are posted constitutes acceptance of the new terms.`
        },
        {
          title: "12. Contact Us",
          content: `If you have any questions about these terms, please contact:

**Dreamweldtech**
Address: High-Tech Park, District 9, Ho Chi Minh City, Vietnam
Email: legal@dreamweldtech.com
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
