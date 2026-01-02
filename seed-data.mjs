import { drizzle } from "drizzle-orm/mysql2";
import { 
  productCategories, 
  products, 
  news, 
  siteSettings 
} from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("🌱 Seeding database...");

  // Seed Product Categories
  console.log("📁 Creating product categories...");
  const categories = [
    {
      name: "Máy Hàn Laser",
      slug: "may-han-laser",
      description: "Các dòng máy hàn laser công nghiệp với độ chính xác cao, phù hợp cho hàn kim loại mỏng và chi tiết phức tạp.",
      image: "/images/product-laser-welder.jpg",
      sortOrder: 1,
    },
    {
      name: "Máy Cắt Laser",
      slug: "may-cat-laser",
      description: "Máy cắt laser fiber công suất cao, cắt nhanh và chính xác trên nhiều loại vật liệu kim loại.",
      image: "/images/product-laser-cutter.jpg",
      sortOrder: 2,
    },
    {
      name: "Máy Làm Sạch Laser",
      slug: "may-lam-sach-laser",
      description: "Giải pháp làm sạch bề mặt không tiếp xúc, loại bỏ rỉ sét, sơn, dầu mỡ mà không làm hư hại vật liệu gốc.",
      image: "/images/product-laser-cleaner.jpg",
      sortOrder: 3,
    },
    {
      name: "Giải Pháp Tự Động Hóa",
      slug: "tu-dong-hoa",
      description: "Hệ thống robot và tự động hóa tích hợp công nghệ laser cho dây chuyền sản xuất hiện đại.",
      image: "/images/about-factory.jpg",
      sortOrder: 4,
    },
  ];

  for (const cat of categories) {
    try {
      await db.insert(productCategories).values(cat);
      console.log(`  ✓ Created category: ${cat.name}`);
    } catch (e) {
      console.log(`  ⚠ Category ${cat.name} may already exist`);
    }
  }

  // Seed Products
  console.log("📦 Creating products...");
  const productsData = [
    {
      categoryId: 1,
      name: "DW-LW1500 Máy Hàn Laser Cầm Tay",
      slug: "dw-lw1500-may-han-laser-cam-tay",
      shortDescription: "Máy hàn laser cầm tay công suất 1500W, dễ dàng vận hành, phù hợp cho hàn kim loại mỏng.",
      description: "DW-LW1500 là dòng máy hàn laser cầm tay thế hệ mới với công suất 1500W, được thiết kế đặc biệt cho các ứng dụng hàn kim loại mỏng trong ngành công nghiệp ô tô, điện tử và gia công cơ khí. Với thiết kế nhỏ gọn và súng hàn ergonomic, người vận hành có thể dễ dàng thực hiện các mối hàn chính xác trong không gian hẹp.",
      image: "/images/product-laser-welder.jpg",
      specifications: JSON.stringify({
        "Công suất laser": "1500W",
        "Loại laser": "Fiber Laser",
        "Bước sóng": "1064nm",
        "Độ rộng mối hàn": "0.2-4mm",
        "Độ sâu hàn": "0.5-3mm",
        "Tốc độ hàn": "0-120mm/s",
        "Hệ thống làm mát": "Làm mát bằng nước",
        "Nguồn điện": "220V/50Hz",
        "Kích thước": "800x600x1000mm",
        "Trọng lượng": "120kg"
      }),
      features: JSON.stringify([
        "Công suất cao 1500W cho tốc độ hàn nhanh",
        "Thiết kế súng hàn nhẹ, chỉ 0.7kg",
        "Hệ thống làm mát nước hiệu quả",
        "Giao diện điều khiển màn hình cảm ứng",
        "Tích hợp hệ thống an toàn đa lớp",
        "Hỗ trợ hàn nhiều loại kim loại"
      ]),
      applications: JSON.stringify([
        "Hàn thép không gỉ (Inox)",
        "Hàn thép carbon",
        "Hàn nhôm và hợp kim nhôm",
        "Hàn đồng và hợp kim đồng",
        "Hàn titan",
        "Hàn kẽm"
      ]),
      isFeatured: "true",
      sortOrder: 1,
    },
    {
      categoryId: 1,
      name: "DW-LW2000 Máy Hàn Laser Công Nghiệp",
      slug: "dw-lw2000-may-han-laser-cong-nghiep",
      shortDescription: "Máy hàn laser công nghiệp 2000W với hệ thống tự động, phù hợp cho sản xuất hàng loạt.",
      description: "DW-LW2000 là giải pháp hàn laser công nghiệp cao cấp với công suất 2000W, được thiết kế cho các nhà máy sản xuất quy mô lớn. Hệ thống tích hợp bàn làm việc CNC và phần mềm điều khiển thông minh.",
      image: "/images/product-laser-welder.jpg",
      specifications: JSON.stringify({
        "Công suất laser": "2000W",
        "Loại laser": "Fiber Laser",
        "Bước sóng": "1064nm",
        "Độ rộng mối hàn": "0.2-5mm",
        "Độ sâu hàn": "0.5-4mm",
        "Tốc độ hàn": "0-150mm/s",
        "Hệ thống làm mát": "Làm mát bằng nước công nghiệp",
        "Nguồn điện": "380V/50Hz",
        "Kích thước": "1200x800x1500mm",
        "Trọng lượng": "350kg"
      }),
      features: JSON.stringify([
        "Công suất 2000W cho ứng dụng công nghiệp nặng",
        "Bàn làm việc CNC tích hợp",
        "Phần mềm điều khiển thông minh",
        "Hệ thống vision tự động căn chỉnh",
        "Kết nối Industry 4.0",
        "Bảo hành 2 năm"
      ]),
      applications: JSON.stringify([
        "Sản xuất ô tô",
        "Ngành hàng không",
        "Thiết bị y tế",
        "Điện tử tiêu dùng",
        "Năng lượng mặt trời"
      ]),
      isFeatured: "true",
      sortOrder: 2,
    },
    {
      categoryId: 2,
      name: "DW-LC3015 Máy Cắt Laser Fiber",
      slug: "dw-lc3015-may-cat-laser-fiber",
      shortDescription: "Máy cắt laser fiber 3000W với bàn cắt 3000x1500mm, cắt nhanh và chính xác.",
      description: "DW-LC3015 là dòng máy cắt laser fiber hiệu suất cao với công suất 3000W, phù hợp cho cắt kim loại tấm với độ dày lên đến 20mm. Hệ thống được trang bị đầu cắt Raytools và nguồn laser IPG chính hãng.",
      image: "/images/product-laser-cutter.jpg",
      specifications: JSON.stringify({
        "Công suất laser": "3000W",
        "Nguồn laser": "IPG (Đức)",
        "Đầu cắt": "Raytools BT240S",
        "Vùng cắt": "3000x1500mm",
        "Độ dày cắt tối đa (thép carbon)": "20mm",
        "Độ dày cắt tối đa (inox)": "12mm",
        "Tốc độ cắt tối đa": "40m/phút",
        "Độ chính xác định vị": "±0.03mm",
        "Nguồn điện": "380V/50Hz",
        "Trọng lượng máy": "5500kg"
      }),
      features: JSON.stringify([
        "Nguồn laser IPG chính hãng từ Đức",
        "Đầu cắt Raytools với autofocus",
        "Khung máy hàn nguyên khối, độ cứng cao",
        "Hệ thống trao đổi bàn tự động",
        "Phần mềm CypCut chuyên nghiệp",
        "Hệ thống hút khói và lọc bụi"
      ]),
      applications: JSON.stringify([
        "Cắt thép tấm",
        "Cắt inox",
        "Cắt nhôm",
        "Cắt đồng thau",
        "Cắt kim loại trang trí",
        "Gia công cơ khí chính xác"
      ]),
      isFeatured: "true",
      sortOrder: 1,
    },
    {
      categoryId: 3,
      name: "DW-CL200 Máy Làm Sạch Laser Di Động",
      slug: "dw-cl200-may-lam-sach-laser-di-dong",
      shortDescription: "Máy làm sạch laser 200W di động, nhỏ gọn, phù hợp cho làm sạch rỉ sét và sơn cũ.",
      description: "DW-CL200 là giải pháp làm sạch laser di động với công suất 200W, thiết kế dạng ba lô tiện lợi cho việc di chuyển. Máy có thể loại bỏ rỉ sét, sơn, dầu mỡ và các lớp phủ bề mặt mà không làm hư hại vật liệu gốc.",
      image: "/images/product-laser-cleaner.jpg",
      specifications: JSON.stringify({
        "Công suất laser": "200W",
        "Loại laser": "Pulsed Fiber Laser",
        "Bước sóng": "1064nm",
        "Tần số xung": "1-4000kHz",
        "Độ rộng làm sạch": "10-160mm",
        "Tốc độ làm sạch": "15-30m²/giờ",
        "Hệ thống làm mát": "Làm mát bằng không khí",
        "Nguồn điện": "220V/50Hz",
        "Trọng lượng": "28kg (bao gồm ba lô)"
      }),
      features: JSON.stringify([
        "Thiết kế di động dạng ba lô",
        "Làm mát bằng không khí, không cần nước",
        "Súng làm sạch nhẹ, dễ vận hành",
        "An toàn, không hóa chất độc hại",
        "Không tạo ra chất thải thứ cấp",
        "Bảo trì đơn giản"
      ]),
      applications: JSON.stringify([
        "Làm sạch rỉ sét trên kim loại",
        "Loại bỏ sơn cũ",
        "Làm sạch khuôn mẫu",
        "Chuẩn bị bề mặt trước khi hàn",
        "Bảo trì thiết bị công nghiệp",
        "Phục hồi di tích lịch sử"
      ]),
      isFeatured: "true",
      sortOrder: 1,
    },
  ];

  for (const prod of productsData) {
    try {
      await db.insert(products).values(prod);
      console.log(`  ✓ Created product: ${prod.name}`);
    } catch (e) {
      console.log(`  ⚠ Product ${prod.name} may already exist`);
    }
  }

  // Seed News
  console.log("📰 Creating news articles...");
  const newsData = [
    {
      title: "Dreamweldtech Ra Mắt Dòng Máy Hàn Laser Thế Hệ Mới 2024",
      slug: "dreamweldtech-ra-mat-dong-may-han-laser-the-he-moi-2024",
      excerpt: "Dreamweldtech chính thức giới thiệu dòng máy hàn laser DW-LW Series với nhiều cải tiến vượt trội về công suất và hiệu năng.",
      content: "<p>Ngày 15/01/2024, Dreamweldtech đã chính thức ra mắt dòng máy hàn laser thế hệ mới DW-LW Series tại triển lãm công nghiệp quốc tế Vietnam Manufacturing Expo 2024.</p><p>Dòng sản phẩm mới được trang bị nguồn laser fiber công suất từ 1500W đến 3000W, mang lại tốc độ hàn nhanh hơn 30% so với thế hệ trước. Đặc biệt, hệ thống làm mát mới giúp máy hoạt động ổn định trong điều kiện sản xuất liên tục 24/7.</p><p>Ông Nguyễn Văn A, Giám đốc Kỹ thuật của Dreamweldtech cho biết: 'Chúng tôi đã đầu tư nghiên cứu trong 2 năm để phát triển dòng sản phẩm này. Mục tiêu là mang đến cho khách hàng Việt Nam những giải pháp hàn laser tiên tiến nhất với chi phí hợp lý.'</p>",
      image: "/images/hero-banner.jpg",
      category: "Tin tức công ty",
      tags: JSON.stringify(["máy hàn laser", "sản phẩm mới", "triển lãm"]),
      isPublished: "true",
      publishedAt: new Date("2024-01-15"),
    },
    {
      title: "Xu Hướng Ứng Dụng Công Nghệ Laser Trong Ngành Ô Tô 2024",
      slug: "xu-huong-ung-dung-cong-nghe-laser-trong-nganh-o-to-2024",
      excerpt: "Phân tích các xu hướng mới nhất trong việc ứng dụng công nghệ laser cho sản xuất ô tô, từ hàn khung gầm đến cắt chi tiết nội thất.",
      content: "<p>Ngành công nghiệp ô tô đang chứng kiến sự chuyển đổi mạnh mẽ với việc áp dụng ngày càng nhiều công nghệ laser trong quy trình sản xuất. Từ hàn khung gầm, cắt chi tiết đến làm sạch bề mặt, laser đang trở thành công nghệ không thể thiếu.</p><h3>1. Hàn Laser Trong Sản Xuất Khung Xe</h3><p>Các nhà sản xuất ô tô hàng đầu như Toyota, Honda, và VinFast đều đang sử dụng công nghệ hàn laser để tạo ra các mối hàn chính xác và bền vững cho khung xe.</p><h3>2. Cắt Laser Cho Chi Tiết Nội Thất</h3><p>Công nghệ cắt laser được sử dụng để tạo ra các chi tiết nội thất với độ chính xác cao và thẩm mỹ tốt.</p>",
      image: "/images/about-factory.jpg",
      category: "Công nghệ",
      tags: JSON.stringify(["công nghệ laser", "ngành ô tô", "xu hướng"]),
      isPublished: "true",
      publishedAt: new Date("2024-02-20"),
    },
    {
      title: "Hướng Dẫn Bảo Trì Máy Cắt Laser Đúng Cách",
      slug: "huong-dan-bao-tri-may-cat-laser-dung-cach",
      excerpt: "Những lưu ý quan trọng và quy trình bảo trì định kỳ giúp máy cắt laser hoạt động ổn định và kéo dài tuổi thọ.",
      content: "<p>Bảo trì đúng cách là yếu tố quan trọng để đảm bảo máy cắt laser hoạt động ổn định và có tuổi thọ cao. Dưới đây là hướng dẫn chi tiết về quy trình bảo trì máy cắt laser.</p><h3>Bảo Trì Hàng Ngày</h3><ul><li>Kiểm tra và vệ sinh thấu kính bảo vệ</li><li>Kiểm tra áp suất khí cắt</li><li>Vệ sinh bàn cắt và loại bỏ xỉ</li></ul><h3>Bảo Trì Hàng Tuần</h3><ul><li>Kiểm tra hệ thống làm mát</li><li>Bôi trơn các trục chuyển động</li><li>Kiểm tra căng đai</li></ul>",
      image: "/images/product-laser-cutter.jpg",
      category: "Hướng dẫn",
      tags: JSON.stringify(["bảo trì", "máy cắt laser", "hướng dẫn"]),
      isPublished: "true",
      publishedAt: new Date("2024-03-10"),
    },
  ];

  for (const article of newsData) {
    try {
      await db.insert(news).values(article);
      console.log(`  ✓ Created article: ${article.title}`);
    } catch (e) {
      console.log(`  ⚠ Article ${article.title} may already exist`);
    }
  }

  // Seed Site Settings
  console.log("⚙️ Creating site settings...");
  const settingsData = [
    { settingKey: "site_name", settingValue: "Dreamweldtech", settingType: "text", description: "Tên website" },
    { settingKey: "site_tagline", settingValue: "Giải Pháp Công Nghệ Laser Hàng Đầu", settingType: "text", description: "Slogan website" },
    { settingKey: "contact_phone", settingValue: "+84 123 456 789", settingType: "text", description: "Số điện thoại liên hệ" },
    { settingKey: "contact_email", settingValue: "contact@dreamweldtech.com", settingType: "text", description: "Email liên hệ" },
    { settingKey: "contact_address", settingValue: "Khu Công Nghệ Cao, Quận 9, TP. Hồ Chí Minh, Việt Nam", settingType: "text", description: "Địa chỉ công ty" },
    { settingKey: "social_facebook", settingValue: "https://facebook.com/dreamweldtech", settingType: "text", description: "Link Facebook" },
    { settingKey: "social_linkedin", settingValue: "https://linkedin.com/company/dreamweldtech", settingType: "text", description: "Link LinkedIn" },
    { settingKey: "social_youtube", settingValue: "https://youtube.com/@dreamweldtech", settingType: "text", description: "Link YouTube" },
  ];

  for (const setting of settingsData) {
    try {
      await db.insert(siteSettings).values(setting);
      console.log(`  ✓ Created setting: ${setting.settingKey}`);
    } catch (e) {
      console.log(`  ⚠ Setting ${setting.settingKey} may already exist`);
    }
  }

  console.log("✅ Database seeding completed!");
  process.exit(0);
}

seed().catch((e) => {
  console.error("❌ Seeding failed:", e);
  process.exit(1);
});
