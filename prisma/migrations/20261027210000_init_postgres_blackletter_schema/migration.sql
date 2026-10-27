-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "blackletter";

-- CreateTable
CREATE TABLE "blackletter"."Staff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADJUSTER',
    "licenseNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blackletter"."ClaimMirror" (
    "id" TEXT NOT NULL,
    "blackboxClaimId" TEXT NOT NULL,
    "claimNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lossType" TEXT NOT NULL,
    "dateOfLoss" TIMESTAMP(3) NOT NULL,
    "propertyAddress" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "lossDescription" TEXT,
    "policyNumber" TEXT,
    "carrierName" TEXT,
    "insurerClaimNumber" TEXT,
    "deskExaminerName" TEXT,
    "deskExaminerPhone" TEXT,
    "deskExaminerEmail" TEXT,
    "fieldAdjusterName" TEXT,
    "estimatedValue" DOUBLE PRECISION,
    "demandAmount" DOUBLE PRECISION,
    "rcvAmount" DOUBLE PRECISION,
    "acvAmount" DOUBLE PRECISION,
    "settlementAmount" DOUBLE PRECISION,
    "settlementDate" TIMESTAMP(3),
    "contingencyFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "isCatClaim" BOOLEAN NOT NULL DEFAULT false,
    "aobApplicable" BOOLEAN NOT NULL DEFAULT false,
    "assignedAdjuster" TEXT,
    "assignedAdjusterLicense" TEXT,
    "claimantFirstName" TEXT NOT NULL,
    "claimantLastName" TEXT NOT NULL,
    "claimantEmail" TEXT NOT NULL,
    "claimantPhone" TEXT NOT NULL,
    "claimantMailing" TEXT NOT NULL,
    "intakeNumber" TEXT,
    "intakeDocumentsJson" TEXT NOT NULL DEFAULT '[]',
    "mirrorScopeJson" TEXT NOT NULL DEFAULT '{}',
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimMirror_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blackletter"."DocumentTemplate" (
    "id" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "mergeFieldsJson" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "currentVersionId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blackletter"."TemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "changeNote" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blackletter"."DocumentStageMap" (
    "id" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "claimStatusesJson" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "aobOnly" BOOLEAN NOT NULL DEFAULT false,
    "templateId" TEXT,

    CONSTRAINT "DocumentStageMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blackletter"."GeneratedDocument" (
    "id" TEXT NOT NULL,
    "claimMirrorId" TEXT NOT NULL,
    "blackboxClaimId" TEXT NOT NULL,
    "claimNumber" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateVersionId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mergedBody" TEXT NOT NULL,
    "mergeValuesJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "fileUrl" TEXT,
    "fileName" TEXT,
    "generatedById" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "ledgerPayoutId" TEXT,
    "blackboxDocumentId" TEXT,
    "blackgateIntakeId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blackletter"."SignatureRequest" (
    "id" TEXT NOT NULL,
    "generatedDocumentId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'google_workspace',
    "providerDocumentId" TEXT NOT NULL,
    "embeddedUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'created',
    "recipientName" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "testMode" BOOLEAN NOT NULL DEFAULT true,
    "lastEventType" TEXT,
    "lastEventAt" TIMESTAMP(3),
    "requestedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignatureRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blackletter"."SignatureEvent" (
    "id" TEXT NOT NULL,
    "signatureRequestId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignatureEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blackletter"."LetterAuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "metaJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LetterAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "blackletter"."Staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimMirror_blackboxClaimId_key" ON "blackletter"."ClaimMirror"("blackboxClaimId");

-- CreateIndex
CREATE UNIQUE INDEX "ClaimMirror_claimNumber_key" ON "blackletter"."ClaimMirror"("claimNumber");

-- CreateIndex
CREATE INDEX "ClaimMirror_status_idx" ON "blackletter"."ClaimMirror"("status");

-- CreateIndex
CREATE INDEX "ClaimMirror_updatedAt_idx" ON "blackletter"."ClaimMirror"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTemplate_documentType_key" ON "blackletter"."DocumentTemplate"("documentType");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTemplate_currentVersionId_key" ON "blackletter"."DocumentTemplate"("currentVersionId");

-- CreateIndex
CREATE INDEX "DocumentTemplate_stage_isActive_idx" ON "blackletter"."DocumentTemplate"("stage", "isActive");

-- CreateIndex
CREATE INDEX "TemplateVersion_templateId_createdAt_idx" ON "blackletter"."TemplateVersion"("templateId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateVersion_templateId_version_key" ON "blackletter"."TemplateVersion"("templateId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentStageMap_documentType_key" ON "blackletter"."DocumentStageMap"("documentType");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentStageMap_templateId_key" ON "blackletter"."DocumentStageMap"("templateId");

-- CreateIndex
CREATE INDEX "GeneratedDocument_claimMirrorId_generatedAt_idx" ON "blackletter"."GeneratedDocument"("claimMirrorId", "generatedAt");

-- CreateIndex
CREATE INDEX "GeneratedDocument_blackboxClaimId_generatedAt_idx" ON "blackletter"."GeneratedDocument"("blackboxClaimId", "generatedAt");

-- CreateIndex
CREATE INDEX "GeneratedDocument_claimNumber_idx" ON "blackletter"."GeneratedDocument"("claimNumber");

-- CreateIndex
CREATE INDEX "GeneratedDocument_status_documentType_idx" ON "blackletter"."GeneratedDocument"("status", "documentType");

-- CreateIndex
CREATE INDEX "GeneratedDocument_templateVersionId_idx" ON "blackletter"."GeneratedDocument"("templateVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "SignatureRequest_providerDocumentId_key" ON "blackletter"."SignatureRequest"("providerDocumentId");

-- CreateIndex
CREATE INDEX "SignatureRequest_generatedDocumentId_idx" ON "blackletter"."SignatureRequest"("generatedDocumentId");

-- CreateIndex
CREATE INDEX "SignatureRequest_status_idx" ON "blackletter"."SignatureRequest"("status");

-- CreateIndex
CREATE INDEX "SignatureEvent_signatureRequestId_receivedAt_idx" ON "blackletter"."SignatureEvent"("signatureRequestId", "receivedAt");

-- CreateIndex
CREATE INDEX "LetterAuditEvent_createdAt_idx" ON "blackletter"."LetterAuditEvent"("createdAt");

-- CreateIndex
CREATE INDEX "LetterAuditEvent_actorId_idx" ON "blackletter"."LetterAuditEvent"("actorId");

-- CreateIndex
CREATE INDEX "LetterAuditEvent_action_idx" ON "blackletter"."LetterAuditEvent"("action");

-- AddForeignKey
ALTER TABLE "blackletter"."DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "blackletter"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blackletter"."DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "blackletter"."TemplateVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blackletter"."TemplateVersion" ADD CONSTRAINT "TemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "blackletter"."DocumentTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blackletter"."TemplateVersion" ADD CONSTRAINT "TemplateVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "blackletter"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blackletter"."DocumentStageMap" ADD CONSTRAINT "DocumentStageMap_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "blackletter"."DocumentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blackletter"."GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_claimMirrorId_fkey" FOREIGN KEY ("claimMirrorId") REFERENCES "blackletter"."ClaimMirror"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blackletter"."GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "blackletter"."DocumentTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blackletter"."GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "blackletter"."TemplateVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blackletter"."GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "blackletter"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blackletter"."SignatureRequest" ADD CONSTRAINT "SignatureRequest_generatedDocumentId_fkey" FOREIGN KEY ("generatedDocumentId") REFERENCES "blackletter"."GeneratedDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blackletter"."SignatureRequest" ADD CONSTRAINT "SignatureRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "blackletter"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blackletter"."SignatureEvent" ADD CONSTRAINT "SignatureEvent_signatureRequestId_fkey" FOREIGN KEY ("signatureRequestId") REFERENCES "blackletter"."SignatureRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blackletter"."LetterAuditEvent" ADD CONSTRAINT "LetterAuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "blackletter"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Lock down Data API access (apps use Prisma as table owner).

ALTER TABLE "blackletter"."Staff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "blackletter"."ClaimMirror" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "blackletter"."DocumentTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "blackletter"."TemplateVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "blackletter"."DocumentStageMap" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "blackletter"."GeneratedDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "blackletter"."SignatureRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "blackletter"."SignatureEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "blackletter"."LetterAuditEvent" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  "blackletter"."Staff",
  "blackletter"."ClaimMirror",
  "blackletter"."DocumentTemplate",
  "blackletter"."TemplateVersion",
  "blackletter"."DocumentStageMap",
  "blackletter"."GeneratedDocument",
  "blackletter"."SignatureRequest",
  "blackletter"."SignatureEvent",
  "blackletter"."LetterAuditEvent"
FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA blackletter REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA blackletter REVOKE ALL ON SEQUENCES FROM anon, authenticated;
