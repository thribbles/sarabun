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

  private formatDoc(doc: any) {
    let parsedFields = doc.fields;
    if (typeof doc.fields === "string") {
      try {
        parsedFields = JSON.parse(doc.fields);
      } catch {
        parsedFields = {};
      }
    }
    return {
      ...doc,
      fields: parsedFields || {},
      docType: doc.docType || "memo",
    };
  }

  async findAll(filter: { status?: string; department?: string; q?: string; page: number }) {
    const pageSize = 50;
    const docs = await this.prisma.document.findMany({
      where: {
        status: filter.status,
        departmentId: filter.department,
        subject: filter.q ? { contains: filter.q } : undefined,
      },
      skip: (filter.page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: "desc" },
    });
    return docs.map((d) => this.formatDoc(d));
  }

  async create(dto: CreateDocumentDto) {
    const fieldsStr =
      typeof dto.fields === "object" ? JSON.stringify(dto.fields) : dto.fields;

    const doc = await this.prisma.document.create({
      data: {
        subject: dto.subject,
        docType: dto.docType || "memo",
        documentNo: dto.documentNo,
        toPerson: dto.toPerson,
        reference: dto.reference,
        status: dto.status || "DRAFT",
        departmentId: dto.departmentId,
        createdById: dto.createdById,
        fields: fieldsStr,
      },
    });
    await this.logAction(doc.id, "CREATE");
    return this.formatDoc(doc);
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { contents: true, signers: true, attachments: true },
    });
    if (!doc) throw new NotFoundException("Document not found");
    return this.formatDoc(doc);
  }

  async update(id: string, dto: UpdateDocumentDto) {
    const dataToUpdate: any = {};
    if (dto.subject !== undefined) dataToUpdate.subject = dto.subject;
    if (dto.docType !== undefined) dataToUpdate.docType = dto.docType;
    if (dto.documentNo !== undefined) dataToUpdate.documentNo = dto.documentNo;
    if (dto.toPerson !== undefined) dataToUpdate.toPerson = dto.toPerson;
    if (dto.reference !== undefined) dataToUpdate.reference = dto.reference;
    if (dto.status !== undefined) dataToUpdate.status = dto.status;
    if (dto.fields !== undefined) {
      dataToUpdate.fields =
        typeof dto.fields === "object" ? JSON.stringify(dto.fields) : dto.fields;
    }

    const doc = await this.prisma.document.update({
      where: { id },
      data: dataToUpdate,
    });
    await this.logAction(id, "UPDATE");
    return this.formatDoc(doc);
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
    return this.formatDoc(updated);
  }

  async logAction(documentId: string, action: string) {
    return this.prisma.documentLog.create({
      data: { documentId, action },
    });
  }

  async renderPdf(id: string) {
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
