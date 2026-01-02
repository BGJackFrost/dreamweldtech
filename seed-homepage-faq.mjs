import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function seed() {
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Connected to database");

  // Seed Home Page Sections
  const homePageSections = [
    {
      sectionKey: "hero",
      title: "Đỉnh Cao Công Nghệ Gia Công Chính Xác",
      titleEn: "Peak Technology Precision Manufacturing",
      subtitle: "Công Nghệ Laser Tiên Tiến",
      subtitleEn: "Advanced Laser Technology",
      content: "Dreamweldtech cung cấp giải pháp toàn diện về máy hàn, cắt và làm sạch laser cho nền công nghiệp hiện đại. Hiệu suất vượt trội, độ bền tối đa.",
      contentEn: "Dreamweldtech provides comprehensive solutions for laser welding, cutting and cleaning machines for modern industry. Superior performance, maximum durability.",
      buttonText: "Khám Phá Sản Phẩm",
      buttonTextEn: "Explore Products",
      buttonLink: "/products",
      backgroundImage: "/images/hero-banner.jpg",
      sortOrder: 1,
      isActive: "true",
    },
    {
      sectionKey: "about",
      title: "Tiên Phong Trong Công Nghệ Laser",
      titleEn: "Pioneering In Laser Technology",
      subtitle: "Về Chúng Tôi",
      subtitleEn: "About Us",
      content: "Với hơn 10 năm kinh nghiệm, Dreamweldtech tự hào là đơn vị hàng đầu trong lĩnh vực cung cấp giải pháp công nghệ laser công nghiệp tại Việt Nam.",
      contentEn: "With over 10 years of experience, Dreamweldtech is proud to be the leading provider of industrial laser technology solutions in Vietnam.",
      buttonText: "Xem Thêm",
      buttonTextEn: "Learn More",
      buttonLink: "/about",
      sortOrder: 2,
      isActive: "true",
    },
    {
      sectionKey: "products",
      title: "Giải Pháp Laser Toàn Diện",
      titleEn: "Comprehensive Laser Solutions",
      subtitle: "Sản Phẩm",
      subtitleEn: "Products",
      content: "Khám phá các dòng máy hàn, cắt và làm sạch laser công nghệ cao, được thiết kế cho hiệu suất tối ưu và độ bền vượt trội.",
      contentEn: "Discover high-tech laser welding, cutting and cleaning machines designed for optimal performance and superior durability.",
      buttonText: "Xem Tất Cả",
      buttonTextEn: "View All",
      buttonLink: "/products",
      sortOrder: 3,
      isActive: "true",
    },
    {
      sectionKey: "solutions",
      title: "Ứng Dụng Đa Ngành",
      titleEn: "Multi-Industry Applications",
      subtitle: "Giải Pháp",
      subtitleEn: "Solutions",
      content: "Công nghệ laser của chúng tôi được ứng dụng rộng rãi trong nhiều ngành công nghiệp khác nhau.",
      contentEn: "Our laser technology is widely applied in many different industries.",
      buttonText: "Tìm Hiểu",
      buttonTextEn: "Learn More",
      buttonLink: "/solutions",
      sortOrder: 4,
      isActive: "true",
    },
    {
      sectionKey: "cta",
      title: "Cần Hỗ Trợ Ngay?",
      titleEn: "Need Help Now?",
      subtitle: "Liên Hệ",
      subtitleEn: "Contact",
      content: "Gọi ngay hotline để được tư vấn trực tiếp từ đội ngũ chuyên gia của chúng tôi.",
      contentEn: "Call our hotline for direct consultation from our expert team.",
      buttonText: "Liên Hệ Ngay",
      buttonTextEn: "Contact Now",
      buttonLink: "/contact",
      sortOrder: 5,
      isActive: "true",
    },
  ];

  console.log("Seeding Home Page Sections...");
  for (const section of homePageSections) {
    await connection.execute(
      `INSERT INTO home_page_sections (sectionKey, title, titleEn, subtitle, subtitleEn, content, contentEn, buttonText, buttonTextEn, buttonLink, backgroundImage, sortOrder, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       title = VALUES(title), titleEn = VALUES(titleEn), subtitle = VALUES(subtitle), subtitleEn = VALUES(subtitleEn),
       content = VALUES(content), contentEn = VALUES(contentEn), buttonText = VALUES(buttonText), buttonTextEn = VALUES(buttonTextEn),
       buttonLink = VALUES(buttonLink), backgroundImage = VALUES(backgroundImage), sortOrder = VALUES(sortOrder), isActive = VALUES(isActive)`,
      [
        section.sectionKey,
        section.title,
        section.titleEn,
        section.subtitle,
        section.subtitleEn,
        section.content,
        section.contentEn,
        section.buttonText,
        section.buttonTextEn,
        section.buttonLink,
        section.backgroundImage || null,
        section.sortOrder,
        section.isActive,
      ]
    );
    console.log(`  - ${section.sectionKey}`);
  }

  // Seed FAQs
  const faqs = [
    {
      question: "Thời gian bảo hành là bao lâu?",
      questionEn: "How long is the warranty period?",
      answer: "Tất cả sản phẩm của Dreamweldtech được bảo hành từ 12-24 tháng tùy theo dòng máy, với dịch vụ hỗ trợ kỹ thuật trọn đời.",
      answerEn: "All Dreamweldtech products come with 12-24 months warranty depending on the model, with lifetime technical support.",
      category: "warranty",
      sortOrder: 1,
    },
    {
      question: "Có hỗ trợ lắp đặt và đào tạo không?",
      questionEn: "Is installation and training support available?",
      answer: "Chúng tôi cung cấp dịch vụ lắp đặt tại chỗ và đào tạo vận hành miễn phí cho tất cả khách hàng mua máy.",
      answerEn: "We provide on-site installation and free operation training for all customers who purchase machines.",
      category: "support",
      sortOrder: 2,
    },
    {
      question: "Có thể xem demo máy trước khi mua không?",
      questionEn: "Can I see a demo before purchasing?",
      answer: "Có, quý khách có thể đến showroom của chúng tôi để xem demo trực tiếp hoặc yêu cầu demo tại nhà máy của mình.",
      answerEn: "Yes, you can visit our showroom for a live demo or request a demo at your factory.",
      category: "products",
      sortOrder: 3,
    },
    {
      question: "Phương thức thanh toán như thế nào?",
      questionEn: "What are the payment methods?",
      answer: "Chúng tôi hỗ trợ nhiều phương thức thanh toán linh hoạt: chuyển khoản, trả góp, và thanh toán theo tiến độ.",
      answerEn: "We support flexible payment methods: bank transfer, installment, and progress-based payment.",
      category: "payment",
      sortOrder: 4,
    },
    {
      question: "Thời gian giao hàng mất bao lâu?",
      questionEn: "How long does delivery take?",
      answer: "Thời gian giao hàng từ 7-30 ngày tùy theo dòng máy và số lượng đặt hàng. Chúng tôi sẽ thông báo cụ thể khi xác nhận đơn hàng.",
      answerEn: "Delivery time is 7-30 days depending on the machine model and order quantity. We will notify you specifically when confirming the order.",
      category: "shipping",
      sortOrder: 5,
    },
    {
      question: "Máy laser có an toàn không?",
      questionEn: "Is laser machine safe?",
      answer: "Tất cả máy laser của chúng tôi đều được trang bị hệ thống an toàn đạt chuẩn quốc tế, bao gồm cảm biến bảo vệ, nút dừng khẩn cấp và hệ thống làm mát tự động.",
      answerEn: "All our laser machines are equipped with international standard safety systems, including protective sensors, emergency stop buttons and automatic cooling systems.",
      category: "products",
      sortOrder: 6,
    },
    {
      question: "Có hỗ trợ kỹ thuật từ xa không?",
      questionEn: "Is remote technical support available?",
      answer: "Có, đội ngũ kỹ thuật của chúng tôi hỗ trợ 24/7 qua điện thoại, email và kết nối từ xa để giải quyết các vấn đề kỹ thuật nhanh chóng.",
      answerEn: "Yes, our technical team provides 24/7 support via phone, email and remote connection to quickly resolve technical issues.",
      category: "support",
      sortOrder: 7,
    },
    {
      question: "Có chính sách đổi trả không?",
      questionEn: "Is there a return policy?",
      answer: "Chúng tôi cam kết đổi trả trong vòng 7 ngày nếu máy có lỗi từ nhà sản xuất. Vui lòng liên hệ bộ phận chăm sóc khách hàng để được hỗ trợ.",
      answerEn: "We commit to exchange within 7 days if the machine has manufacturer defects. Please contact customer service for assistance.",
      category: "warranty",
      sortOrder: 8,
    },
  ];

  console.log("\nSeeding FAQs...");
  for (const faq of faqs) {
    await connection.execute(
      `INSERT INTO faqs (question, questionEn, answer, answerEn, category, sortOrder, isActive)
       VALUES (?, ?, ?, ?, ?, ?, 'true')`,
      [faq.question, faq.questionEn, faq.answer, faq.answerEn, faq.category, faq.sortOrder]
    );
    console.log(`  - ${faq.question.substring(0, 40)}...`);
  }

  console.log("\n✅ Seed completed successfully!");
  await connection.end();
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
