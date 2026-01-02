import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const samplePartners = [
  {
    name: 'Toyota Vietnam',
    slug: 'toyota-vietnam',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Toyota.svg/200px-Toyota.svg.png',
    description: 'Nhà sản xuất ô tô hàng đầu Nhật Bản',
    website: 'https://toyota.com.vn',
    category: 'manufacturer',
    testimonial: 'Dreamweldtech đã cung cấp giải pháp hàn laser tuyệt vời cho dây chuyền sản xuất của chúng tôi. Chất lượng mối hàn và độ ổn định của máy vượt xa kỳ vọng.',
    testimonialAuthor: 'Nguyễn Văn Minh',
    testimonialPosition: 'Giám đốc Sản xuất',
    sortOrder: 1,
    isActive: 'true',
    isFeatured: 'true',
  },
  {
    name: 'Samsung Electronics Vietnam',
    slug: 'samsung-electronics-vietnam',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/200px-Samsung_Logo.svg.png',
    description: 'Tập đoàn điện tử hàng đầu Hàn Quốc',
    website: 'https://samsung.com/vn',
    category: 'manufacturer',
    testimonial: 'Máy cắt laser của Dreamweldtech giúp chúng tôi tăng năng suất 40% và giảm chi phí vận hành đáng kể.',
    testimonialAuthor: 'Park Jin Soo',
    testimonialPosition: 'Production Manager',
    sortOrder: 2,
    isActive: 'true',
    isFeatured: 'true',
  },
  {
    name: 'Vinfast',
    slug: 'vinfast',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/VinFast_2017.svg/200px-VinFast_2017.svg.png',
    description: 'Thương hiệu ô tô Việt Nam',
    website: 'https://vinfast.vn',
    category: 'manufacturer',
    testimonial: 'Đội ngũ kỹ thuật của Dreamweldtech rất chuyên nghiệp, hỗ trợ nhanh chóng và hiệu quả.',
    testimonialAuthor: 'Trần Thị Hương',
    testimonialPosition: 'Trưởng phòng Kỹ thuật',
    sortOrder: 3,
    isActive: 'true',
    isFeatured: 'true',
  },
  {
    name: 'Honda Vietnam',
    slug: 'honda-vietnam',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Honda.svg/200px-Honda.svg.png',
    description: 'Nhà sản xuất xe máy và ô tô Nhật Bản',
    website: 'https://honda.com.vn',
    category: 'manufacturer',
    testimonial: null,
    testimonialAuthor: null,
    testimonialPosition: null,
    sortOrder: 4,
    isActive: 'true',
    isFeatured: 'false',
  },
  {
    name: 'Thaco',
    slug: 'thaco',
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/a/a8/Thaco_logo.svg/200px-Thaco_logo.svg.png',
    description: 'Tập đoàn ô tô lớn nhất Việt Nam',
    website: 'https://thaco.com.vn',
    category: 'manufacturer',
    testimonial: 'Chúng tôi đã sử dụng máy làm sạch laser của Dreamweldtech trong 3 năm và rất hài lòng với hiệu quả làm việc.',
    testimonialAuthor: 'Lê Văn Đức',
    testimonialPosition: 'Giám đốc Nhà máy',
    sortOrder: 5,
    isActive: 'true',
    isFeatured: 'false',
  },
  {
    name: 'Hòa Phát Group',
    slug: 'hoa-phat-group',
    logo: 'https://upload.wikimedia.org/wikipedia/vi/thumb/f/f7/Logo_Hoa_Phat.svg/200px-Logo_Hoa_Phat.svg.png',
    description: 'Tập đoàn sản xuất thép hàng đầu Việt Nam',
    website: 'https://hoaphat.com.vn',
    category: 'enterprise',
    testimonial: 'Giải pháp tự động hóa của Dreamweldtech đã giúp chúng tôi nâng cao hiệu suất sản xuất lên 35%.',
    testimonialAuthor: 'Phạm Quốc Hùng',
    testimonialPosition: 'Phó Tổng Giám đốc',
    sortOrder: 6,
    isActive: 'true',
    isFeatured: 'true',
  },
  {
    name: 'Mitsubishi Electric Vietnam',
    slug: 'mitsubishi-electric-vietnam',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Mitsubishi_logo.svg/200px-Mitsubishi_logo.svg.png',
    description: 'Tập đoàn điện tử Nhật Bản',
    website: 'https://mitsubishielectric.com.vn',
    category: 'distributor',
    testimonial: null,
    testimonialAuthor: null,
    testimonialPosition: null,
    sortOrder: 7,
    isActive: 'true',
    isFeatured: 'false',
  },
  {
    name: 'Panasonic Vietnam',
    slug: 'panasonic-vietnam',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Panasonic_logo.svg/200px-Panasonic_logo.svg.png',
    description: 'Tập đoàn điện tử đa quốc gia Nhật Bản',
    website: 'https://panasonic.com/vn',
    category: 'enterprise',
    testimonial: null,
    testimonialAuthor: null,
    testimonialPosition: null,
    sortOrder: 8,
    isActive: 'true',
    isFeatured: 'false',
  },
  {
    name: 'Bộ Công Thương',
    slug: 'bo-cong-thuong',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Emblem_of_Vietnam.svg/200px-Emblem_of_Vietnam.svg.png',
    description: 'Cơ quan quản lý nhà nước về công nghiệp và thương mại',
    website: 'https://moit.gov.vn',
    category: 'government',
    testimonial: null,
    testimonialAuthor: null,
    testimonialPosition: null,
    sortOrder: 9,
    isActive: 'true',
    isFeatured: 'false',
  },
  {
    name: 'LG Electronics Vietnam',
    slug: 'lg-electronics-vietnam',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/LG_symbol.svg/200px-LG_symbol.svg.png',
    description: 'Tập đoàn điện tử Hàn Quốc',
    website: 'https://lg.com/vn',
    category: 'manufacturer',
    testimonial: 'Dreamweldtech là đối tác đáng tin cậy trong lĩnh vực công nghệ laser.',
    testimonialAuthor: 'Kim Sung Hoon',
    testimonialPosition: 'Technical Director',
    sortOrder: 10,
    isActive: 'true',
    isFeatured: 'false',
  },
];

async function seedPartners() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('Seeding partners data...');
  
  for (const partner of samplePartners) {
    try {
      await connection.execute(
        `INSERT INTO partners (name, slug, logo, description, website, category, testimonial, testimonialAuthor, testimonialPosition, sortOrder, isActive, isFeatured, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          partner.name,
          partner.slug,
          partner.logo,
          partner.description,
          partner.website,
          partner.category,
          partner.testimonial,
          partner.testimonialAuthor,
          partner.testimonialPosition,
          partner.sortOrder,
          partner.isActive,
          partner.isFeatured,
        ]
      );
      console.log(`✓ Added partner: ${partner.name}`);
    } catch (error) {
      console.error(`✗ Error adding ${partner.name}:`, error.message);
    }
  }
  
  await connection.end();
  console.log('Done seeding partners!');
}

seedPartners().catch(console.error);
