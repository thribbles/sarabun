import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDocumentDto, UpdateDocumentDto } from "./dto";

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["REVIEW", "CANCELLED"],
  REVIEW: ["APPROVED", "DRAFT", "CANCELLED"],
  APPROVED: ["PRINTED", "CANCELLED"],
  PRINTED: [],
  CANCELLED: [],
};

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filter: { status?: string; department?: string; q?: string; page: number }) {
    const pageSize = 20;
    return this.prisma.document.findMany({
      where: {
        status: filter.status,
        departmentId: filter.department,
        subject: filter.q ? { contains: filter.q, mode: "insensitive" } : undefined,
      },
      skip: (filter.page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    });
  }

  async create(dto: CreateDocumentDto) {
    const doc = await this.prisma.document.create({ data: dto as any });
    await this.logAction(doc.id, "CREATE");
    return doc;
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { contents: true, signers: true, attachments: true },
    });
    if (!doc) throw new NotFoundException("Document not found");
    return doc;
  }

  async update(id: string, dto: UpdateDocumentDto) {
    const doc = await this.prisma.document.update({ where: { id }, data: dto as any });
    await this.logAction(id, "UPDATE");
    return doc;
  }

  async remove(id: string) {
    await this.prisma.document.delete({ where: { id } });
    return { deleted: true };
  }

  async transition(id: string, target: string) {
    const doc = await this.findOne(id);
    const allowed = VALID_TRANSITIONS[doc.status] ?? [];
    if (!allowed.includes(target)) {
      throw new Error(`Cannot transition from ${doc.status} to ${target}`);
    }
    const updated = await this.prisma.document.update({
      where: { id },
      data: { status: target },
    });
    await this.logAction(id, target === "APPROVED" ? "APPROVE" : "UPDATE");
    return updated;
  }

  async logAction(documentId: string, action: string) {
    return this.prisma.documentLog.create({
      data: { documentId, action },
    });
  }

  async renderPdf(id: string) {
    // TODO: ส่ง HTML (จาก PrintPage component render ฝั่ง server) เข้า Chromium headless
    // แล้ว stream กลับเป็น PDF — ดู architecture.md ข้อ 2 และ 5
    await this.logAction(id, "EXPORT_PDF");
    return { message: "PDF generation not yet implemented — wire up Chromium headless here" };
  }

  listRevisions(documentId: string) {
    return this.prisma.documentRevision.findMany({
      where: { documentId },
      orderBy: { createdAt: "desc" },
    });
  }
}
