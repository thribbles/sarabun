import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { DocumentsModule } from "./documents/documents.module";
// TODO: เพิ่มโมดูลอื่นตามลำดับใน architecture.md ข้อ 7 (MVP Roadmap)
// import { AuthModule } from "./auth/auth.module";
// import { UsersModule } from "./users/users.module";
// import { TemplatesModule } from "./templates/templates.module";

@Module({
  imports: [PrismaModule, DocumentsModule],
})
export class AppModule {}
