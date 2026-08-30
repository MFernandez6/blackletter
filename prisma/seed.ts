/**
 * BLACKLETTER seed — staff, templates (all lifecycle types), stage map,
 * claim mirrors, and sample generated documents.
 *
 *   ALLOW_DESTRUCTIVE_SEED=1 npx prisma db seed
 *
 * Default password: Password123!
 * NEVER run against production.
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { TEMPLATE_CATALOG } from "../src/lib/templates/catalog";
import { extractMergeFields, mergeTemplate, valuesFromClaim } from "../src/lib/merge";
import { DOCUMENT_TYPE_LABELS } from "../src/lib/constants";
import type { DocumentType } from "../src/lib/types";

const prisma = new PrismaClient();

if (process.env.ALLOW_DESTRUCTIVE_SEED !== "1") {
  console.error(
    "Refusing to seed: set ALLOW_DESTRUCTIVE_SEED=1. Never use on production."
  );
  process.exit(1);
}

const SEED_PASSWORD = "Password123!";

async function main() {
  await prisma.signatureEvent.deleteMany();
  await prisma.signatureRequest.deleteMany();
  await prisma.generatedDocument.deleteMany();
  await prisma.documentStageMap.deleteMany();
  await prisma.documentTemplate.updateMany({ data: { currentVersionId: null } });
  await prisma.templateVersion.deleteMany();
  await prisma.documentTemplate.deleteMany();
  await prisma.letterAuditEvent.deleteMany();
  await prisma.claimMirror.deleteMany();
  await prisma.staff.deleteMany();

  const passwordHash = await hash(SEED_PASSWORD, 10);

  const miguel = await prisma.staff.create({
    data: {
      name: "Miguel Fernandez",
      email: "miguel.fernandez@blacklineadjusting.com",
      passwordHash,
      role: "ADMIN",
      licenseNumber: "W123456",
    },
  });
  const diana = await prisma.staff.create({
    data: {
      name: "Diana Reyes",
      email: "diana.reyes@blacklineadjusting.com",
      passwordHash,
      role: "ADJUSTER",
      licenseNumber: "W234567",
    },
  });
  await prisma.staff.create({
    data: {
      name: "Viewer Desk",
      email: "viewer@blacklineadjusting.com",
      passwordHash,
      role: "VIEWER",
    },
  });

  for (const entry of TEMPLATE_CATALOG) {
    const fields = extractMergeFields(entry.body);
    const template = await prisma.documentTemplate.create({
      data: {
        documentType: entry.documentType,
        name: entry.name,
        description: entry.description,
        stage: entry.stage,
        mergeFieldsJson: JSON.stringify(fields),
        createdById: miguel.id,
      },
    });
    const v1 = await prisma.templateVersion.create({
      data: {
        templateId: template.id,
        version: 1,
        body: entry.body,
        changeNote: "Initial Florida PA library (seed).",
        createdById: miguel.id,
      },
    });
    await prisma.documentTemplate.update({
      where: { id: template.id },
      data: { currentVersionId: v1.id },
    });
    await prisma.documentStageMap.create({
      data: {
        documentType: entry.documentType,
        stage: entry.stage,
        claimStatusesJson: JSON.stringify(entry.claimStatuses),
        sortOrder: entry.sortOrder,
        required: entry.required,
        aobOnly: entry.aobOnly,
        templateId: template.id,
      },
    });
  }

  const claims = [
    {
      blackboxClaimId: "bb-lor-intake",
      claimNumber: "BL-26-0001",
      status: "INTAKE",
      lossType: "WIND",
      daysAgo: 12,
      propertyAddress: "1842 Ocean Breeze Dr",
      zipCode: "33139",
      county: "Miami-Dade",
      lossDescription: "Hurricane-driven wind lifted tiles along the south slope and opened the ridge.",
      policyNumber: "HO-88421",
      carrierName: "Citizens Property Insurance",
      insurerClaimNumber: null,
      estimatedValue: 48200,
      contingencyFeePercent: 10,
      isCatClaim: true,
      aobApplicable: false,
      assignedAdjuster: "Diana Reyes",
      assignedAdjusterLicense: "W234567",
      claimantFirstName: "Elena",
      claimantLastName: "Vasquez",
      claimantEmail: "elena.vasquez@email.com",
      claimantPhone: "(305) 555-0142",
      claimantMailing: "1842 Ocean Breeze Dr, Miami Beach, FL 33139",
      intakeNumber: "BG-26-0104",
      intakeDocumentsJson: JSON.stringify([
        { documentType: "LOR", status: "executed", source: "BLACKGATE" },
      ]),
      mirrorScopeJson: JSON.stringify({
        photoCount: 4,
        scopeSummary: "Intake photos only — full BLACKMIRROR inspection not yet run.",
      }),
    },
    {
      blackboxClaimId: "bb-filed-scope",
      claimNumber: "BL-26-0004",
      status: "FILED",
      lossType: "WATER",
      daysAgo: 40,
      propertyAddress: "901 Pinecrest Lane",
      zipCode: "32801",
      county: "Orange",
      lossDescription: "Supply-line failure in the upstairs bath; water migrated to the kitchen ceiling.",
      policyNumber: "HO-22910",
      carrierName: "Universal Property & Casualty",
      insurerClaimNumber: "UPC-26-44110",
      deskExaminerName: "Chris Lang",
      estimatedValue: 27650,
      demandAmount: 31200,
      rcvAmount: 31800,
      acvAmount: 24100,
      contingencyFeePercent: 20,
      isCatClaim: false,
      aobApplicable: true,
      assignedAdjuster: "Diana Reyes",
      assignedAdjusterLicense: "W234567",
      claimantFirstName: "James",
      claimantLastName: "Whitaker",
      claimantEmail: "j.whitaker@email.com",
      claimantPhone: "(407) 555-0190",
      claimantMailing: "901 Pinecrest Lane, Orlando, FL 32801",
      intakeNumber: "BG-26-0088",
      intakeDocumentsJson: JSON.stringify([
        { documentType: "LOR", status: "executed", source: "BLACKGATE" },
        { documentType: "PA_CONTRACT", status: "executed", source: "BLACKGATE" },
        { documentType: "CLIENT_DISCLOSURE", status: "executed", source: "BLACKGATE" },
      ]),
      mirrorScopeJson: JSON.stringify({
        photoCount: 36,
        scopeSummary:
          "Wet drywall at kitchen ceiling, swollen cabinets, cupping on oak, isolation of upstairs bath valve.",
      }),
    },
    {
      blackboxClaimId: "bb-negotiating",
      claimNumber: "BL-26-0007",
      status: "NEGOTIATING",
      lossType: "HAIL",
      daysAgo: 70,
      propertyAddress: "415 Sabal Palm Ct",
      zipCode: "33411",
      county: "Palm Beach",
      lossDescription: "April hail event bruised shingles and dented the HVAC coil housing.",
      policyNumber: "HO-55102",
      carrierName: "Heritage Property & Casualty",
      insurerClaimNumber: "HPC-26-1902",
      deskExaminerName: "Nina Patel",
      estimatedValue: 41000,
      demandAmount: 46500,
      rcvAmount: 47200,
      acvAmount: 38800,
      contingencyFeePercent: 20,
      isCatClaim: false,
      aobApplicable: false,
      assignedAdjuster: "Miguel Fernandez",
      assignedAdjusterLicense: "W123456",
      claimantFirstName: "Aisha",
      claimantLastName: "Coleman",
      claimantEmail: "aisha.coleman@email.com",
      claimantPhone: "(561) 555-0177",
      claimantMailing: "415 Sabal Palm Ct, Royal Palm Beach, FL 33411",
      intakeNumber: "BG-26-0061",
      intakeDocumentsJson: "[]",
      mirrorScopeJson: JSON.stringify({
        photoCount: 52,
        scopeSummary:
          "Soft-metal dents on coil guard, granule loss on south and west slopes, two cracked skylight flanges.",
      }),
    },
    {
      blackboxClaimId: "bb-settled",
      claimNumber: "BL-26-0012",
      status: "SETTLED",
      lossType: "FIRE",
      daysAgo: 120,
      propertyAddress: "77 Magnolia Ave",
      zipCode: "32301",
      county: "Leon",
      lossDescription: "Kitchen fire from unattended oil; smoke throughout the first floor.",
      policyNumber: "HO-10088",
      carrierName: "Florida Peninsula",
      insurerClaimNumber: "FP-25-8831",
      deskExaminerName: "Robert Hale",
      estimatedValue: 128000,
      demandAmount: 141000,
      rcvAmount: 146000,
      acvAmount: 119500,
      settlementAmount: 136400,
      settlementDate: new Date(),
      contingencyFeePercent: 20,
      isCatClaim: false,
      aobApplicable: false,
      assignedAdjuster: "Miguel Fernandez",
      assignedAdjusterLicense: "W123456",
      claimantFirstName: "Carol",
      claimantLastName: "Diaz",
      claimantEmail: "carol.diaz@email.com",
      claimantPhone: "(850) 555-0114",
      claimantMailing: "77 Magnolia Ave, Tallahassee, FL 32301",
      intakeNumber: "BG-25-0440",
      intakeDocumentsJson: JSON.stringify([
        { documentType: "LOR", status: "executed", source: "BLACKGATE" },
        { documentType: "PA_CONTRACT", status: "executed", source: "BLACKGATE" },
        { documentType: "CLIENT_DISCLOSURE", status: "executed", source: "BLACKGATE" },
      ]),
      mirrorScopeJson: JSON.stringify({
        photoCount: 80,
        scopeSummary: "Kitchen rebuild, smoke seal, contents pack-out, ALE through reoccupation.",
      }),
    },
  ];

  const mirrors: Array<Awaited<ReturnType<typeof prisma.claimMirror.create>>> =
    [];
  for (const c of claims) {
    const dol = new Date();
    dol.setDate(dol.getDate() - c.daysAgo);
    const created = await prisma.claimMirror.create({
      data: {
        blackboxClaimId: c.blackboxClaimId,
        claimNumber: c.claimNumber,
        status: c.status,
        lossType: c.lossType,
        dateOfLoss: dol,
        propertyAddress: c.propertyAddress,
        zipCode: c.zipCode,
        county: c.county,
        lossDescription: c.lossDescription,
        policyNumber: c.policyNumber,
        carrierName: c.carrierName,
        insurerClaimNumber: c.insurerClaimNumber,
        deskExaminerName: c.deskExaminerName ?? null,
        estimatedValue: c.estimatedValue ?? null,
        demandAmount: c.demandAmount ?? null,
        rcvAmount: c.rcvAmount ?? null,
        acvAmount: c.acvAmount ?? null,
        settlementAmount: c.settlementAmount ?? null,
        settlementDate: c.settlementDate ?? null,
        contingencyFeePercent: c.contingencyFeePercent,
        isCatClaim: c.isCatClaim,
        aobApplicable: c.aobApplicable,
        assignedAdjuster: c.assignedAdjuster,
        assignedAdjusterLicense: c.assignedAdjusterLicense,
        claimantFirstName: c.claimantFirstName,
        claimantLastName: c.claimantLastName,
        claimantEmail: c.claimantEmail,
        claimantPhone: c.claimantPhone,
        claimantMailing: c.claimantMailing,
        intakeNumber: c.intakeNumber,
        intakeDocumentsJson: c.intakeDocumentsJson,
        mirrorScopeJson: c.mirrorScopeJson,
      },
    });
    mirrors.push(created);
  }

  async function generateSeedDoc(opts: {
    claimIndex: number;
    documentType: DocumentType;
    status: "draft" | "sent" | "signed" | "executed";
    by: string;
    daysAgo: number;
  }) {
    const claim = mirrors[opts.claimIndex];
    const template = await prisma.documentTemplate.findUnique({
      where: { documentType: opts.documentType },
    });
    if (!template?.currentVersionId || !claim) return;
    const version = await prisma.templateVersion.findUnique({
      where: { id: template.currentVersionId },
    });
    if (!version) return;
    const scope = JSON.parse(claim.mirrorScopeJson) as {
      photoCount?: number;
      scopeSummary?: string;
    };
    const values = valuesFromClaim({
      ...claim,
      scopeSummary: scope.scopeSummary ?? null,
      photoCount: scope.photoCount ?? null,
    });
    const at = new Date();
    at.setDate(at.getDate() - opts.daysAgo);
    await prisma.generatedDocument.create({
      data: {
        claimMirrorId: claim.id,
        blackboxClaimId: claim.blackboxClaimId,
        claimNumber: claim.claimNumber,
        templateId: template.id,
        templateVersionId: version.id,
        documentType: opts.documentType,
        title: `${DOCUMENT_TYPE_LABELS[opts.documentType]} — ${claim.claimNumber}`,
        mergedBody: mergeTemplate(version.body, values),
        mergeValuesJson: JSON.stringify(values),
        status: opts.status,
        generatedById: opts.by,
        generatedAt: at,
        sentAt: opts.status !== "draft" ? at : null,
        signedAt:
          opts.status === "signed" || opts.status === "executed" ? at : null,
        executedAt: opts.status === "executed" ? at : null,
      },
    });
  }

  await generateSeedDoc({
    claimIndex: 1,
    documentType: "NOTICE_OF_CLAIM",
    status: "executed",
    by: diana.id,
    daysAgo: 18,
  });
  await generateSeedDoc({
    claimIndex: 1,
    documentType: "PROOF_OF_LOSS",
    status: "sent",
    by: diana.id,
    daysAgo: 6,
  });
  await generateSeedDoc({
    claimIndex: 2,
    documentType: "LOR",
    status: "executed",
    by: miguel.id,
    daysAgo: 60,
  });
  await generateSeedDoc({
    claimIndex: 2,
    documentType: "DEMAND_LETTER",
    status: "draft",
    by: miguel.id,
    daysAgo: 2,
  });
  await generateSeedDoc({
    claimIndex: 3,
    documentType: "SETTLEMENT_AGREEMENT",
    status: "signed",
    by: miguel.id,
    daysAgo: 1,
  });

  await prisma.letterAuditEvent.create({
    data: {
      actorId: miguel.id,
      action: "SEED",
      entityType: "DocumentTemplate",
      summary: "Seeded BLACKLETTER library, stage map, and sample files.",
    },
  });

  console.log("BLACKLETTER seed complete.");
  console.log("  Admin    miguel.fernandez@blacklineadjusting.com / Password123!");
  console.log("  Adjuster diana.reyes@blacklineadjusting.com / Password123!");
  console.log("  Viewer   viewer@blacklineadjusting.com / Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
