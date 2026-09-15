export class CreateDocumentDto {
  documentTypeId!: number;
  templateId?: string;
  departmentId?: string;
  subject!: string;
  toPerson?: string;
  reference?: string;
  createdById?: string;
}

export class UpdateDocumentDto {
  subject?: string;
  toPerson?: string;
  reference?: string;
  documentNo?: string;
}
