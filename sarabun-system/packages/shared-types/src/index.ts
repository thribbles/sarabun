export type DocumentTypeCode = "memo" | "external" | "internal" | "stamped" | "attachment";

export type DocumentStatus = "DRAFT" | "REVIEW" | "APPROVED" | "PRINTED" | "CANCELLED";

export interface DocumentFields {
  documentNo?: string;
  date: string;
  subject: string;
  to: string;
  body: string;
  signerName?: string;
  signerPosition?: string;
  department?: string;
  agencyTop?: string;
  agencyAddress?: string;
  reference?: string;
  enclosure?: string;
  footerOffice?: string;
}

export interface DocumentItem {
  id: string;
  documentNo?: string;
  type: DocumentTypeCode;
  subject: string;
  status: DocumentStatus;
  fields: DocumentFields;
  createdAt: string;
  updatedAt: string;
}
