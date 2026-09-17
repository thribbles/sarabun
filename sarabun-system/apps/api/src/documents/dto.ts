import { IsOptional, IsString } from "class-validator";

export class CreateDocumentDto {
  @IsString()
  subject!: string;

  @IsOptional()
  @IsString()
  docType?: string; // "memo" | "external"

  @IsOptional()
  @IsString()
  documentNo?: string;

  @IsOptional()
  documentTypeId?: number;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  toPerson?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  fields?: any;

  @IsOptional()
  @IsString()
  createdById?: string;
}

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  docType?: string;

  @IsOptional()
  @IsString()
  documentNo?: string;

  @IsOptional()
  @IsString()
  toPerson?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  fields?: any;
}
