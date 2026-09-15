import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query,
} from "@nestjs/common";
import { DocumentsService } from "./documents.service";
import { CreateDocumentDto, UpdateDocumentDto } from "./dto";

@Controller("documents")
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  findAll(
    @Query("status") status?: string,
    @Query("department") department?: string,
    @Query("q") q?: string,
    @Query("page") page = "1",
  ) {
    return this.documentsService.findAll({ status, department, q, page: Number(page) });
  }

  @Post()
  create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.documentsService.remove(id);
  }

  @Post(":id/submit-review")
  submitReview(@Param("id") id: string) {
    return this.documentsService.transition(id, "REVIEW");
  }

  @Post(":id/approve")
  approve(@Param("id") id: string) {
    return this.documentsService.transition(id, "APPROVED");
  }

  @Post(":id/reject")
  reject(@Param("id") id: string) {
    return this.documentsService.transition(id, "DRAFT");
  }

  @Post(":id/print")
  print(@Param("id") id: string) {
    return this.documentsService.logAction(id, "PRINT");
  }

  @Get(":id/pdf")
  exportPdf(@Param("id") id: string) {
    return this.documentsService.renderPdf(id);
  }

  @Get(":id/revisions")
  revisions(@Param("id") id: string) {
    return this.documentsService.listRevisions(id);
  }
}
