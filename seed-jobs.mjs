import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dreamweldtech',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

const jobs = [
  {
    title: "Kỹ Sư Cơ Khí",
    slug: "ky-su-co-khi",
    department: "Kỹ thuật",
    location: "TP. Hồ Chí Minh",
    type: "full-time",
    experience: "3-5 năm",
    salary: "20-30 triệu VNĐ",
    description: `
## Mô tả công việc

Dreamweldtech đang tìm kiếm Kỹ sư Cơ khí có kinh nghiệm để gia nhập đội ngũ kỹ thuật của chúng tôi. Bạn sẽ tham gia vào việc thiết kế, phát triển và tối ưu hóa các giải pháp hàn laser cho khách hàng công nghiệp.

### Trách nhiệm chính:
- Thiết kế và phát triển các giải pháp cơ khí cho hệ thống laser
- Phối hợp với đội ngũ R&D để phát triển sản phẩm mới
- Hỗ trợ kỹ thuật cho khách hàng
- Tham gia lắp đặt và vận hành thiết bị tại nhà máy khách hàng
- Viết tài liệu kỹ thuật và hướng dẫn sử dụng
    `,
    requirements: `
## Yêu cầu

### Bắt buộc:
- Tốt nghiệp Đại học chuyên ngành Cơ khí, Cơ điện tử hoặc tương đương
- Có ít nhất 3 năm kinh nghiệm trong lĩnh vực thiết kế cơ khí
- Thành thạo AutoCAD, SolidWorks hoặc phần mềm CAD tương đương
- Có kiến thức về công nghệ hàn và gia công kim loại
- Tiếng Anh giao tiếp tốt

### Ưu tiên:
- Có kinh nghiệm với công nghệ laser
- Có chứng chỉ AWS (American Welding Society)
- Có kinh nghiệm làm việc trong môi trường sản xuất công nghiệp
    `,
    benefits: `
## Quyền lợi

- Mức lương cạnh tranh: 20-30 triệu VNĐ/tháng
- Thưởng hiệu suất hàng quý và thưởng cuối năm
- Bảo hiểm sức khỏe cao cấp cho bản thân và gia đình
- Đào tạo chuyên sâu về công nghệ laser tại nước ngoài
- Môi trường làm việc chuyên nghiệp, năng động
- Cơ hội thăng tiến rõ ràng
- Nghỉ phép 15 ngày/năm
    `,
    isActive: "true"
  },
  {
    title: "Kỹ Sư Tự Động Hóa",
    slug: "ky-su-tu-dong-hoa",
    department: "R&D",
    location: "TP. Hồ Chí Minh",
    type: "full-time",
    experience: "2-4 năm",
    salary: "18-28 triệu VNĐ",
    description: `
## Mô tả công việc

Chúng tôi đang tìm kiếm Kỹ sư Tự động hóa để phát triển các giải pháp robot và tự động hóa cho hệ thống laser công nghiệp.

### Trách nhiệm chính:
- Lập trình và tích hợp robot công nghiệp (FANUC, KUKA, ABB)
- Phát triển hệ thống điều khiển PLC cho dây chuyền sản xuất
- Thiết kế và triển khai hệ thống SCADA
- Tối ưu hóa quy trình sản xuất tự động
- Hỗ trợ khách hàng trong việc vận hành và bảo trì hệ thống
    `,
    requirements: `
## Yêu cầu

### Bắt buộc:
- Tốt nghiệp Đại học chuyên ngành Tự động hóa, Điện tử hoặc tương đương
- Có ít nhất 2 năm kinh nghiệm lập trình PLC (Siemens, Mitsubishi, Allen-Bradley)
- Có kinh nghiệm lập trình robot công nghiệp
- Thành thạo ngôn ngữ lập trình C/C++, Python
- Tiếng Anh đọc hiểu tài liệu kỹ thuật

### Ưu tiên:
- Có kinh nghiệm với hệ thống vision
- Có chứng chỉ lập trình robot FANUC/KUKA
- Có kinh nghiệm triển khai Industry 4.0
    `,
    benefits: `
## Quyền lợi

- Mức lương: 18-28 triệu VNĐ/tháng
- Thưởng dự án và thưởng hiệu suất
- Bảo hiểm y tế toàn diện
- Đào tạo chuyên sâu về robot và tự động hóa
- Cơ hội làm việc với công nghệ tiên tiến nhất
- Môi trường làm việc quốc tế
    `,
    isActive: "true"
  },
  {
    title: "Nhân Viên Kinh Doanh B2B",
    slug: "nhan-vien-kinh-doanh-b2b",
    department: "Kinh doanh",
    location: "TP. Hồ Chí Minh, Hà Nội",
    type: "full-time",
    experience: "2-5 năm",
    salary: "15-25 triệu VNĐ + Hoa hồng",
    description: `
## Mô tả công việc

Dreamweldtech tìm kiếm Nhân viên Kinh doanh B2B năng động để mở rộng thị trường và phát triển khách hàng trong lĩnh vực công nghiệp.

### Trách nhiệm chính:
- Tìm kiếm và phát triển khách hàng mới trong ngành công nghiệp
- Tư vấn giải pháp công nghệ laser phù hợp với nhu cầu khách hàng
- Đàm phán và ký kết hợp đồng
- Duy trì và phát triển mối quan hệ với khách hàng hiện tại
- Tham gia các triển lãm và sự kiện ngành
- Báo cáo doanh số và hoạt động kinh doanh
    `,
    requirements: `
## Yêu cầu

### Bắt buộc:
- Tốt nghiệp Đại học chuyên ngành Kinh tế, Kỹ thuật hoặc tương đương
- Có ít nhất 2 năm kinh nghiệm bán hàng B2B trong lĩnh vực công nghiệp
- Kỹ năng giao tiếp và thuyết trình xuất sắc
- Có khả năng làm việc độc lập và theo nhóm
- Sẵn sàng đi công tác

### Ưu tiên:
- Có kinh nghiệm bán thiết bị công nghiệp
- Có mạng lưới khách hàng trong ngành sản xuất
- Tiếng Anh giao tiếp tốt
    `,
    benefits: `
## Quyền lợi

- Lương cơ bản: 15-25 triệu VNĐ/tháng
- Hoa hồng hấp dẫn không giới hạn
- Thưởng đạt KPI hàng quý
- Bảo hiểm sức khỏe cao cấp
- Xe công ty và phụ cấp xăng xe
- Điện thoại và laptop làm việc
- Đào tạo sản phẩm và kỹ năng bán hàng
    `,
    isActive: "true"
  },
  {
    title: "Kỹ Thuật Viên Bảo Trì",
    slug: "ky-thuat-vien-bao-tri",
    department: "Dịch vụ",
    location: "TP. Hồ Chí Minh",
    type: "full-time",
    experience: "1-3 năm",
    salary: "12-18 triệu VNĐ",
    description: `
## Mô tả công việc

Chúng tôi cần Kỹ thuật viên Bảo trì để hỗ trợ khách hàng trong việc vận hành và bảo trì thiết bị laser.

### Trách nhiệm chính:
- Lắp đặt và vận hành thiết bị laser tại nhà máy khách hàng
- Thực hiện bảo trì định kỳ và sửa chữa thiết bị
- Đào tạo vận hành cho nhân viên khách hàng
- Hỗ trợ kỹ thuật qua điện thoại và email
- Viết báo cáo kỹ thuật và đề xuất cải tiến
    `,
    requirements: `
## Yêu cầu

### Bắt buộc:
- Tốt nghiệp Cao đẳng/Đại học chuyên ngành Cơ khí, Điện tử
- Có ít nhất 1 năm kinh nghiệm bảo trì thiết bị công nghiệp
- Có kiến thức cơ bản về điện, cơ khí
- Có khả năng đọc bản vẽ kỹ thuật
- Sẵn sàng đi công tác và làm việc ngoài giờ khi cần

### Ưu tiên:
- Có kinh nghiệm với thiết bị laser
- Có bằng lái xe B2
- Tiếng Anh cơ bản
    `,
    benefits: `
## Quyền lợi

- Mức lương: 12-18 triệu VNĐ/tháng
- Phụ cấp đi công tác hấp dẫn
- Bảo hiểm y tế và tai nạn
- Đào tạo chuyên sâu về công nghệ laser
- Cơ hội thăng tiến lên Kỹ sư dịch vụ
- Môi trường làm việc thân thiện
    `,
    isActive: "true"
  },
  {
    title: "Thực Tập Sinh Kỹ Thuật",
    slug: "thuc-tap-sinh-ky-thuat",
    department: "Kỹ thuật",
    location: "TP. Hồ Chí Minh",
    type: "internship",
    experience: "Không yêu cầu",
    salary: "5-8 triệu VNĐ",
    description: `
## Mô tả công việc

Dreamweldtech mở chương trình thực tập cho sinh viên năm cuối ngành Cơ khí, Điện tử, Tự động hóa.

### Trách nhiệm chính:
- Hỗ trợ đội ngũ kỹ thuật trong các dự án
- Tham gia nghiên cứu và phát triển sản phẩm
- Học hỏi về công nghệ laser và tự động hóa
- Viết tài liệu kỹ thuật
- Tham gia các buổi đào tạo nội bộ
    `,
    requirements: `
## Yêu cầu

### Bắt buộc:
- Sinh viên năm cuối ngành Cơ khí, Điện tử, Tự động hóa
- GPA từ 2.5/4.0 trở lên
- Có khả năng làm việc toàn thời gian trong 3-6 tháng
- Ham học hỏi và có tinh thần trách nhiệm
- Kỹ năng làm việc nhóm tốt

### Ưu tiên:
- Có kinh nghiệm với CAD/CAM
- Có kiến thức về lập trình PLC
- Tiếng Anh đọc hiểu tài liệu
    `,
    benefits: `
## Quyền lợi

- Trợ cấp: 5-8 triệu VNĐ/tháng
- Được đào tạo bài bản về công nghệ laser
- Cơ hội trở thành nhân viên chính thức
- Môi trường làm việc chuyên nghiệp
- Được mentor hướng dẫn 1-1
- Chứng nhận thực tập
    `,
    isActive: "true"
  }
];

console.log('Seeding jobs data...');

for (const job of jobs) {
  try {
    await connection.execute(
      `INSERT INTO jobs (title, slug, department, location, type, experience, salary, description, requirements, benefits, isActive) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       title = VALUES(title),
       department = VALUES(department),
       location = VALUES(location),
       type = VALUES(type),
       experience = VALUES(experience),
       salary = VALUES(salary),
       description = VALUES(description),
       requirements = VALUES(requirements),
       benefits = VALUES(benefits),
       isActive = VALUES(isActive)`,
      [
        job.title,
        job.slug,
        job.department,
        job.location,
        job.type,
        job.experience,
        job.salary,
        job.description,
        job.requirements,
        job.benefits,
        job.isActive
      ]
    );
    console.log(`✓ Added/Updated: ${job.title}`);
  } catch (error) {
    console.error(`✗ Error adding ${job.title}:`, error.message);
  }
}

console.log('\\nJobs seeding completed!');
await connection.end();
