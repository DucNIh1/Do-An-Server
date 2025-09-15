import bcrypt from "bcrypt";
import prisma from "../src/utils/prisma.js";

const majors = [
  { code: "7210404", name: "Thiết kế thời trang" },
  { code: "7220201", name: "Ngôn ngữ Anh" },
  { code: "7220204", name: "Ngôn ngữ Trung Quốc" },
  {
    code: "7220204LK",
    name: "Ngôn ngữ Trung Quốc (LK 2+2 với ĐHKHKT Quảng Tây)",
  },
  { code: "7220209", name: "Ngôn ngữ Nhật" },
  { code: "7220210", name: "Ngôn ngữ Hàn Quốc" },
  { code: "7229020", name: "Ngôn ngữ học" },
  { code: "7310104", name: "Kinh tế đầu tư" },
  { code: "7310612", name: "Trung Quốc học" },
  { code: "7340101", name: "Quản trị kinh doanh" },
  { code: "73401012", name: "Phân tích dữ liệu kinh doanh" },
  { code: "7340115", name: "Marketing" },
  { code: "7340201", name: "Tài chính – Ngân hàng" },
  { code: "7340301", name: "Kế toán" },
  { code: "7340301TA", name: "Kế toán (CTĐT bằng tiếng Anh)" },
  { code: "7340302", name: "Kiểm toán" },
  { code: "7340404", name: "Quản trị nhân lực" },
  { code: "7340406", name: "Quản trị văn phòng" },
  { code: "7480101", name: "Khoa học máy tính" },
  { code: "7480101TA", name: "Khoa học máy tính (CTĐT bằng tiếng Anh)" },
  { code: "7480102", name: "Mạng máy tính và truyền thông dữ liệu" },
  { code: "7480103", name: "Kỹ thuật phần mềm" },
  { code: "7480104", name: "Hệ thống thông tin" },
  { code: "7480108", name: "Công nghệ kỹ thuật máy tính" },
  { code: "7480201", name: "Công nghệ thông tin" },
  { code: "74802012", name: "Công nghệ đa phương tiện" },
  { code: "74802021", name: "An toàn thông tin" },
  { code: "7510201", name: "Công nghệ kỹ thuật cơ khí" },
  {
    code: "7510201TA",
    name: "Công nghệ kỹ thuật cơ khí (CTĐT bằng tiếng Anh)",
  },
  { code: "75102012", name: "Công nghệ kỹ thuật khuôn mẫu" },
  { code: "75102013", name: "Thiết kế cơ khí và kiểu dáng công nghiệp" },
  { code: "7510203", name: "Công nghệ kỹ thuật cơ điện tử" },
  { code: "75102032", name: "Robot và trí tuệ nhân tạo" },
  { code: "75102033", name: "Công nghệ kỹ thuật cơ điện tử ô tô" },
  { code: "7510205", name: "Công nghệ kỹ thuật ô tô" },
  { code: "7510205TA", name: "Công nghệ kỹ thuật ô tô (CTĐT bằng tiếng Anh)" },
  { code: "7510206", name: "Công nghệ kỹ thuật nhiệt" },
  { code: "7510301", name: "Công nghệ kỹ thuật điện, điện tử" },
  {
    code: "7510301TA",
    name: "Công nghệ kỹ thuật điện, điện tử (CTĐT bằng tiếng Anh)",
  },
  { code: "75190071", name: "Năng lượng tái tạo" },
  { code: "7510302", name: "Công nghệ kỹ thuật điện tử – viễn thông" },
  {
    code: "7510302TA",
    name: "Công nghệ kỹ thuật điện tử – viễn thông (CTĐT bằng tiếng Anh)",
  },
  { code: "75103021", name: "Công nghệ kỹ thuật điện tử y sinh" },
  { code: "7510303", name: "Công nghệ kỹ thuật điều khiển và tự động hóa" },
  { code: "75103031", name: "Kỹ thuật sản xuất thông minh" },
  { code: "7510401", name: "Công nghệ kỹ thuật hóa học" },
  { code: "7510406", name: "Công nghệ kỹ thuật môi trường" },
  { code: "7510605", name: "Logistics và quản lý chuỗi cung ứng" },
  { code: "7520116", name: "Kỹ thuật cơ khí động lực" },
  { code: "7520118", name: "Kỹ thuật hệ thống công nghiệp" },
  { code: "7540101", name: "Công nghệ thực phẩm" },
  { code: "7540203", name: "Công nghệ vật liệu dệt, may" },
  { code: "7540204", name: "Công nghệ dệt, may" },
  { code: "7720203", name: "Hóa dược" },
  { code: "7810101", name: "Du lịch" },
  { code: "7810101TA", name: "Du lịch (CTĐT bằng tiếng Anh)" },
  { code: "7810103", name: "Quản trị dịch vụ du lịch và lữ hành" },
  {
    code: "7810103TA",
    name: "Quản trị dịch vụ du lịch và lữ hành (CTĐT bằng tiếng Anh)",
  },
  { code: "7810201", name: "Quản trị khách sạn" },
  { code: "7810201TA", name: "Quản trị khách sạn (CTĐT bằng tiếng Anh)" },
  { code: "7810202", name: "Quản trị nhà hàng và dịch vụ ăn uống" },
  {
    code: "7810202TA",
    name: "Quản trị nhà hàng và dịch vụ ăn uống (CTĐT bằng tiếng Anh)",
  },
];

async function main() {
  const hashedAdminPassword = await bcrypt.hash("admin123", 10);
  const hashedAdvisorPassword = await bcrypt.hash("advisor123", 10);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      password: hashedAdminPassword,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "advisor@example.com" },
    update: {},
    create: {
      email: "advisor@example.com",
      name: "Advisor User",
      password: hashedAdvisorPassword,
      role: "ADVISOR",
    },
  });

  for (const major of majors) {
    await prisma.major.upsert({
      where: { code: major.code },
      update: {},
      create: {
        code: major.code,
        name: major.name,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
