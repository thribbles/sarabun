import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDocumentDto, UpdateDocumentDto } from "./dto";

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

  async findAll(filter: { status?: string; department?: string; createdById?: string; q?: string; page: number }) {
    const pageSize = 50;
    const docs = await this.prisma.document.findMany({
      where: {
        status: filter.status,
        departmentId: filter.department,
        createdById: filter.createdById,
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

    let validCreatedById: string | undefined = undefined;
    if (dto.createdById) {
      const userExists = await this.prisma.user.findUnique({
        where: { id: dto.createdById },
      });
      if (userExists) {
        validCreatedById = dto.createdById;
      }
    }

    let validDepartmentId: string | undefined = undefined;
    if (dto.departmentId) {
      const deptExists = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });
      if (deptExists) {
        validDepartmentId = dto.departmentId;
      }
    }

    const doc = await this.prisma.document.create({
      data: {
        subject: dto.subject,
        docType: dto.docType || "memo",
        documentNo: dto.documentNo,
        toPerson: dto.toPerson,
        reference: dto.reference,
        status: dto.status || "DRAFT",
        departmentId: validDepartmentId,
        createdById: validCreatedById,
        fields: fieldsStr,
      },
    });
    try {
      await this.logAction(doc.id, "CREATE");
    } catch (e) {
      // non-blocking
    }
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
    const existing = await this.prisma.document.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException("Document not found");
    }

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
    try {
      await this.logAction(id, "UPDATE");
    } catch (e) {
      // non-blocking
    }
    return this.formatDoc(doc);
  }

  async remove(id: string) {
    const existing = await this.prisma.document.findUnique({ where: { id } });
    if (!existing) {
      return { deleted: true, note: "Document already deleted" };
    }
    await this.prisma.document.delete({ where: { id } });
    return { deleted: true };
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
