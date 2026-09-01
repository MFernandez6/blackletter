import type { ClaimStatus, DocumentType, LifecycleStage } from "@/lib/types";

export type CatalogEntry = {
  documentType: DocumentType;
  name: string;
  description: string;
  stage: LifecycleStage;
  required: boolean;
  aobOnly: boolean;
  sortOrder: number;
  claimStatuses: ClaimStatus[];
  body: string;
};

export const TEMPLATE_CATALOG: CatalogEntry[] = [
  {
    documentType: "LOR",
    name: "Letter of Representation",
    description: "Notifies the carrier that Blackline is the public adjuster of record.",
    stage: "INTAKE_ENGAGEMENT",
    required: true,
    aobOnly: false,
    sortOrder: 10,
    claimStatuses: ["INTAKE", "UNDER_REVIEW", "INVESTIGATION", "FILED"],
    body: `{{today}}

{{carrier_name}}
Attn: {{desk_examiner_name}}
Re: Notice of Representation — {{claimant_name}}
Policy No. {{policy_number}}
Claim No. {{insurer_claim_number}}
Date of Loss: {{date_of_loss}}
Loss Location: {{property_address}}, {{county}} County, {{zip_code}}
Our File: {{claim_number}}

To Whom It May Concern:

Please be advised that {{firm_name}} has been retained as public adjuster of record for {{claimant_name}} in connection with the above-referenced property insurance claim. A copy of the executed contract of employment and the required client disclosure accompany this letter, or will follow under separate cover if already on file through intake.

All future correspondence, inspections, estimates, reservation-of-rights letters, and settlement communications regarding this claim should be directed to the undersigned. Please update your file accordingly and confirm the assigned desk examiner, field adjuster, and any existing claim number if different from the one stated above.

Cause of loss as reported: {{loss_type}}.
Narrative: {{loss_description}}

This letter is sent in the insured's capacity as a claimant under the policy. {{firm_name}} is a licensed public adjusting firm. We do not provide legal advice and do not appear as counsel.

Respectfully,

{{adjuster_name}}
Public Adjuster · License {{adjuster_license}}
{{firm_name}}
`,
  },
  {
    documentType: "PA_CONTRACT",
    name: "PA Contract of Employment",
    description: "Contingency fee agreement under Florida public-adjuster rules.",
    stage: "INTAKE_ENGAGEMENT",
    required: true,
    aobOnly: false,
    sortOrder: 20,
    claimStatuses: ["INTAKE", "UNDER_REVIEW"],
    body: `CONTRACT OF EMPLOYMENT — PUBLIC ADJUSTER
(Contingency Fee Agreement)

This Agreement is entered into as of {{today}} between {{claimant_name}} ("Client") of {{claimant_mailing_address}} and {{firm_name}} ("Firm").

1. Engagement. Client retains Firm as public adjuster to investigate, document, and negotiate the first-party property insurance claim arising from a {{loss_type}} loss on {{date_of_loss}} at {{property_address}}, {{county}} County, Florida {{zip_code}} (Blackline File {{claim_number}}; Policy {{policy_number}}; Carrier {{carrier_name}}).

2. Contingency fee. Client agrees to pay Firm a contingency fee of {{contingency_fee_percent}} of the amounts recovered on the claim, subject to the statutory ceilings in Fla. Stat. § 626.854. On a declared state-of-emergency (CAT) loss the fee shall not exceed the emergency cap then in force. No fee is due if no recovery is obtained.

3. Costs. Ordinary file costs are absorbed by Firm unless otherwise agreed in writing. Expert or engineering retainers, if any, will be disclosed before they are incurred.

4. Client duties. Client will provide truthful information, access to the property, and copies of the policy, correspondence, and prior estimates. Client will not settle the claim directly without notice to Firm.

5. Not legal services. Firm is not a law firm. This engagement is not the practice of law. Client may consult independent counsel at any time.

6. Cancellation. Client may cancel this contract within the period required by Florida law by written notice. After that period, withdrawal is governed by the statute and this agreement.

7. Governing law. Florida law. Venue in the county of the loss or the Firm's principal place of business.

Client signature: ___________________________  Date: ________
Print name: {{claimant_name}}

Firm: {{adjuster_name}}, License {{adjuster_license}}
{{firm_name}}
`,
  },
  {
    documentType: "CLIENT_DISCLOSURE",
    name: "Client / engagement disclosure",
    description: "UPL-compliant disclosure — public adjusting, not legal advice.",
    stage: "INTAKE_ENGAGEMENT",
    required: true,
    aobOnly: false,
    sortOrder: 30,
    claimStatuses: ["INTAKE", "UNDER_REVIEW"],
    body: `CLIENT DISCLOSURE AND ACKNOWLEDGMENT
{{firm_name}}

Date: {{today}}
Client: {{claimant_name}}
File: {{claim_number}} · Intake: {{intake_number}}
Loss: {{loss_type}} on {{date_of_loss}} at {{property_address}}

Please read this disclosure before signing the contract of employment.

1. We are public adjusters, not attorneys. {{firm_name}} is licensed to adjust first-party property claims. We do not give legal advice, draft pleadings, or represent you in court, appraisal as counsel, or at Examination Under Oath as your lawyer.

2. Unauthorized practice of law. Florida prohibits anyone other than a licensed attorney from practicing law. If a coverage dispute, bad-faith question, or lawsuit arises, you should consult independent counsel. We will not interpret your legal rights beyond the adjustment of the insurance claim.

3. Fee. Our compensation is a contingency fee of {{contingency_fee_percent}} of amounts recovered, subject to Fla. Stat. § 626.854. You pay no fee if there is no recovery.

4. You remain the insured. You keep the right to communicate with your carrier. We ask that you copy us so the file stays complete.

5. Documents. You may already have signed a letter of representation or disclosure at intake (BLACKGATE). If so, this form confirms the same terms and is not a second engagement.

I have read this disclosure and understand that {{firm_name}} is not my attorney.

Signature: ___________________________  Date: ________
{{claimant_name}}
{{claimant_email}} · {{claimant_phone}}
`,
  },
  {
    documentType: "AOB",
    name: "Assignment of Benefits",
    description: "Used only when assignment is applicable to the claim type.",
    stage: "INTAKE_ENGAGEMENT",
    required: true,
    aobOnly: true,
    sortOrder: 40,
    claimStatuses: ["INTAKE", "UNDER_REVIEW", "INVESTIGATION"],
    body: `ASSIGNMENT OF BENEFITS

For value received, {{claimant_name}} ("Assignor"), insured under {{carrier_name}} Policy {{policy_number}}, hereby assigns to {{firm_name}} ("Assignee") such rights to policy benefits as are permitted by Florida law and the policy in connection with the {{loss_type}} loss of {{date_of_loss}} at {{property_address}} (File {{claim_number}}).

This assignment is limited to benefits for the claim described above. It does not assign the entire policy, does not transfer title to the property, and does not authorize Assignee to practice law.

Assignor acknowledges that Florida law restricts certain post-loss assignments and that this instrument is used only where assignment is applicable to the claim type. If the policy or statute prohibits assignment, this document is of no effect and the Firm will proceed under the contract of employment alone.

Assignor: ___________________________  Date: ________
{{claimant_name}}
{{claimant_mailing_address}}

Acknowledged: {{adjuster_name}}, License {{adjuster_license}}
`,
  },
  {
    documentType: "NOTICE_OF_CLAIM",
    name: "Notice of Claim / Representation",
    description: "Formal notice of claim and representation to the carrier.",
    stage: "NOTICE_FILING",
    required: true,
    aobOnly: false,
    sortOrder: 10,
    claimStatuses: ["INVESTIGATION", "FILED"],
    body: `{{today}}

{{carrier_name}}
Attn: {{desk_examiner_name}}
Re: Notice of Claim and Representation
Insured: {{claimant_name}}
Policy: {{policy_number}}
Carrier Claim: {{insurer_claim_number}}
Date of Loss: {{date_of_loss}}
Location: {{property_address}}, {{zip_code}}
Blackline File: {{claim_number}}

Dear Claims Department:

This letter constitutes formal notice of a first-party property claim and confirms that {{firm_name}} represents the insured as public adjuster.

Loss type: {{loss_type}}
Description: {{loss_description}}

Please acknowledge this notice, confirm coverage, identify all applicable deductibles and endorsements, and provide the claim-handling guidelines and preferred estimate format. We request that you schedule any inspection through this office.

Kindly direct all communications to {{adjuster_name}}, License {{adjuster_license}}, at {{firm_email}} or {{firm_phone}}.

Very truly yours,

{{adjuster_name}}
{{firm_name}}
`,
  },
  {
    documentType: "PROOF_OF_LOSS",
    name: "Sworn Statement in Proof of Loss",
    description: "Sworn proof of loss for the named insured.",
    stage: "NOTICE_FILING",
    required: true,
    aobOnly: false,
    sortOrder: 20,
    claimStatuses: ["INVESTIGATION", "FILED"],
    body: `SWORN STATEMENT IN PROOF OF LOSS

To: {{carrier_name}}
Policy Number: {{policy_number}}
Claim Number: {{insurer_claim_number}}
Insured: {{claimant_name}}
Address of insured: {{claimant_mailing_address}}
Location of loss: {{property_address}}, {{county}} County, FL {{zip_code}}
Date of loss: {{date_of_loss}}
Cause: {{loss_type}}
Blackline File: {{claim_number}}

The insured, being duly sworn, states:

1. At the time of loss the described property was insured under the policy named above.
2. The loss occurred on the date stated, from the cause stated, and was not caused by any act or design of the insured.
3. The actual cash value of the damaged property is {{acv_amount}}.
4. The replacement cost of the damaged property is {{rcv_amount}}.
5. The estimated amount claimed is {{estimated_value}}.
6. The narrative of loss is: {{loss_description}}

The insured submits this proof of loss and reserves the right to amend it as additional damages are documented, including those reflected in the BLACKMIRROR inspection ({{photo_count}} photographs; scope: {{scope_summary}}).

I declare under penalty of perjury that the foregoing is true and correct.

Insured: ___________________________  Date: ________
{{claimant_name}}

Prepared with: {{adjuster_name}}, License {{adjuster_license}}
{{firm_name}}
`,
  },
  {
    documentType: "SCOPE_LETTER",
    name: "Preliminary damage estimate / scope letter",
    description: "Paired with the BLACKMIRROR photo report.",
    stage: "NOTICE_FILING",
    required: false,
    aobOnly: false,
    sortOrder: 30,
    claimStatuses: ["INVESTIGATION", "FILED", "NEGOTIATING"],
    body: `{{today}}

{{carrier_name}}
Attn: {{desk_examiner_name}}
Re: Preliminary Scope and Estimate
{{claimant_name}} · {{claim_number}} · Policy {{policy_number}}
Loss: {{loss_type}} on {{date_of_loss}} at {{property_address}}

Dear {{desk_examiner_name}}:

Enclosed is our preliminary scope of loss, prepared from the field inspection documented in BLACKMIRROR ({{photo_count}} photographs on file). This letter is paired with that photo report and is not a final sworn proof.

Scope summary:
{{scope_summary}}

Preliminary figures
Replacement cost (RCV): {{rcv_amount}}
Actual cash value (ACV): {{acv_amount}}
Working estimate: {{estimated_value}}

We reserve the right to supplement as hidden damage, code upgrades, or ALE items are confirmed. Please review the photo report and contact {{adjuster_name}} (License {{adjuster_license}}) to discuss line items.

Respectfully,
{{adjuster_name}}
{{firm_name}}
`,
  },
  {
    documentType: "DEMAND_LETTER",
    name: "Demand letter / Reservation of Rights response",
    description: "Demand package or response to a reservation-of-rights letter.",
    stage: "NEGOTIATION",
    required: true,
    aobOnly: false,
    sortOrder: 10,
    claimStatuses: ["NEGOTIATING", "DENIED", "FILED"],
    body: `{{today}}

{{carrier_name}}
Attn: {{desk_examiner_name}}
Re: Demand / Response to Reservation of Rights
Insured: {{claimant_name}}
Policy {{policy_number}} · Claim {{insurer_claim_number}} · File {{claim_number}}
Loss: {{loss_type}} on {{date_of_loss}} · {{property_address}}

Dear {{desk_examiner_name}}:

On behalf of {{claimant_name}}, we demand payment of {{demand_amount}} as the amount due under the policy for the covered {{loss_type}} loss, supported by the estimate, BLACKMIRROR photo report ({{photo_count}} images), and the following narrative:

{{loss_description}}

Field scope:
{{scope_summary}}

If this letter responds to a reservation of rights, please be advised that the insured does not waive any coverage, and we request a written coverage position citing the specific policy language relied upon. A general reservation is not a denial.

Please issue payment or a reasoned written response within the time required by the policy and Florida law. All rights are reserved.

{{adjuster_name}}
Public Adjuster · License {{adjuster_license}}
{{firm_name}}
`,
  },
  {
    documentType: "SUPPLEMENTAL",
    name: "Supplemental claim submission",
    description: "Additional damages after the original submission.",
    stage: "NEGOTIATION",
    required: false,
    aobOnly: false,
    sortOrder: 20,
    claimStatuses: ["NEGOTIATING", "FILED"],
    body: `{{today}}

{{carrier_name}}
Attn: {{desk_examiner_name}}
Re: Supplemental Claim
{{claimant_name}} · {{claim_number}} · {{insurer_claim_number}}
{{property_address}} · DOL {{date_of_loss}}

Dear Claims:

Additional damages have been documented since the original submission. This supplement is based on further inspection and {{photo_count}} photographs now in the BLACKMIRROR report.

Updated scope:
{{scope_summary}}

Working estimate (as supplemented): {{estimated_value}}
Demand as supplemented: {{demand_amount}}

Please reopen the estimate, assign a supplement review, and confirm the revised claim number handling. We will provide line-item support upon request.

{{adjuster_name}}, License {{adjuster_license}}
{{firm_name}}
`,
  },
  {
    documentType: "EUO_LETTER",
    name: "EUO response / prep letter",
    description: "Preparation letter ahead of an Examination Under Oath.",
    stage: "NEGOTIATION",
    required: false,
    aobOnly: false,
    sortOrder: 30,
    claimStatuses: ["NEGOTIATING", "FILED"],
    body: `{{today}}

{{claimant_name}}
{{claimant_mailing_address}}
{{claimant_email}}

Re: Examination Under Oath — preparation
File {{claim_number}} · {{carrier_name}} · {{insurer_claim_number}}
Loss {{date_of_loss}} at {{property_address}}

{{claimant_first_name}},

{{carrier_name}} has requested an Examination Under Oath (EUO). An EUO is a formal, sworn statement. {{firm_name}} is your public adjuster, not your attorney. We cannot represent you as counsel at the EUO. If you want a lawyer present, retain one before the date is set.

What we can do: organize the claim file, review the timeline ({{loss_description}}), and sit with you beforehand so the facts of the loss, the BLACKMIRROR inspection ({{photo_count}} photos), and the numbers (estimate {{estimated_value}}) are familiar.

Please send us the carrier's notice, the proposed date, and any document request list. Do not guess on the record. If you do not know, say so.

{{adjuster_name}}
{{firm_name}} · {{firm_phone}}
`,
  },
  {
    documentType: "APPRAISAL_DEMAND",
    name: "Appraisal demand letter",
    description: "Invokes the policy appraisal clause.",
    stage: "NEGOTIATION",
    required: false,
    aobOnly: false,
    sortOrder: 40,
    claimStatuses: ["NEGOTIATING", "DENIED"],
    body: `{{today}}

{{carrier_name}}
Attn: {{desk_examiner_name}}
Re: Demand for Appraisal
{{claimant_name}} · Policy {{policy_number}} · Claim {{insurer_claim_number}}
File {{claim_number}} · {{property_address}} · DOL {{date_of_loss}}

Dear {{desk_examiner_name}}:

A disagreement exists as to the amount of loss. Pursuant to the appraisal clause of Policy {{policy_number}}, the insured hereby demands appraisal.

The insured's stated amount of loss is {{demand_amount}} (RCV {{rcv_amount}} / ACV {{acv_amount}}). Cause: {{loss_type}}. Supporting inspection: {{scope_summary}}.

Please identify your appraiser in writing within the time required by the policy. We will identify ours. The two appraisers shall select an umpire as the policy provides. This demand concerns amount of loss only and does not waive coverage issues.

{{adjuster_name}}, License {{adjuster_license}}
{{firm_name}}
`,
  },
  {
    documentType: "MEDIATION_REQUEST",
    name: "Mediation request",
    description: "Florida statutory mediation request for property claims.",
    stage: "NEGOTIATION",
    required: false,
    aobOnly: false,
    sortOrder: 50,
    claimStatuses: ["NEGOTIATING", "DENIED"],
    body: `{{today}}

{{carrier_name}}
Attn: {{desk_examiner_name}}
Re: Request for Mediation — Fla. Stat. § 627.7015
{{claimant_name}} · Policy {{policy_number}} · Claim {{insurer_claim_number}}
File {{claim_number}} · {{property_address}} · DOL {{date_of_loss}}

Dear Claims:

The insured requests mediation of this first-party property dispute under Florida's statutory mediation process, Fla. Stat. § 627.7015, and any applicable administrative rules.

Loss: {{loss_type}}. Narrative: {{loss_description}}.
Amount in controversy (demand): {{demand_amount}}.

Please acknowledge this request, provide the carrier's mediation contact, and confirm scheduling through the approved program. {{firm_name}} will attend as public adjuster. We do not appear as legal counsel.

{{adjuster_name}}, License {{adjuster_license}}
{{firm_email}} · {{firm_phone}}
`,
  },
  {
    documentType: "SETTLEMENT_AGREEMENT",
    name: "Settlement agreement / Release of all claims",
    description: "Executed settlement triggers a BLACKLEDGER payout record.",
    stage: "RESOLUTION",
    required: true,
    aobOnly: false,
    sortOrder: 10,
    claimStatuses: ["SETTLED", "CLOSED"],
    body: `SETTLEMENT AGREEMENT AND RELEASE OF CLAIMS

This Settlement Agreement is entered as of {{settlement_date}} (or {{today}} if blank) between {{claimant_name}} ("Releasor") and {{carrier_name}} ("Carrier"), with notice to {{firm_name}}.

Recitals. Releasor made a claim under Policy {{policy_number}} for a {{loss_type}} loss on {{date_of_loss}} at {{property_address}} (Carrier claim {{insurer_claim_number}}; Blackline {{claim_number}}). The parties desire to resolve the claim.

1. Payment. Carrier shall pay {{settlement_amount}} ("Settlement Sum") in full satisfaction of the claim described above.

2. Release. Upon good funds, Releasor releases Carrier from claims arising out of this loss and policy claim, except for obligations in this agreement and any coverage that the parties expressly preserve in writing.

3. Fee. Releasor remains obligated to {{firm_name}} for the contracted contingency of {{contingency_fee_percent}} (fee {{fee_earned}}; net to client {{client_disbursement}}), subject to Fla. Stat. § 626.854. Execution of this agreement is the event that opens the BLACKLEDGER payout record.

4. No admission. This is a compromise. It is not an admission of coverage or liability.

5. Public adjuster. {{firm_name}} is not counsel. Releasor may seek independent legal advice before signing.

Releasor: ___________________________  Date: ________
{{claimant_name}}

Carrier acknowledgment: ___________________________  Date: ________
`,
  },
  {
    documentType: "FULL_FINAL_RELEASE",
    name: "Full and Final Release",
    description: "Property full-and-final release — triggers BLACKLEDGER payout.",
    stage: "RESOLUTION",
    required: true,
    aobOnly: false,
    sortOrder: 20,
    claimStatuses: ["SETTLED", "CLOSED"],
    body: `FULL AND FINAL RELEASE — PROPERTY CLAIM

I, {{claimant_name}}, of {{claimant_mailing_address}}, for the consideration of {{settlement_amount}} paid or to be paid by {{carrier_name}} under Policy {{policy_number}} (Claim {{insurer_claim_number}}; File {{claim_number}}), do hereby fully and finally release {{carrier_name}} and its adjusters, agents, and reinsurers from all claims arising from the {{loss_type}} loss of {{date_of_loss}} at {{property_address}}, {{county}} County, Florida.

This release is limited to the property claim identified above. It does not release unrelated policies or future losses.

I understand the contingency fee due {{firm_name}} is {{contingency_fee_percent}} ({{fee_earned}}), with {{client_disbursement}} to be disbursed to me after fee and agreed costs, as shown on the closing statement.

I have had the opportunity to review this release. {{firm_name}} is my public adjuster, not my attorney.

Signed: ___________________________  Date: ________
{{claimant_name}}
`,
  },
  {
    documentType: "CLOSING_STATEMENT",
    name: "Closing statement / disbursement breakdown",
    description: "Client-facing fee and disbursement breakdown.",
    stage: "RESOLUTION",
    required: true,
    aobOnly: false,
    sortOrder: 30,
    claimStatuses: ["SETTLED", "CLOSED"],
    body: `CLOSING STATEMENT AND DISBURSEMENT BREAKDOWN
{{firm_name}}

File: {{claim_number}}
Client: {{claimant_name}}
{{claimant_mailing_address}}
{{claimant_email}} · {{claimant_phone}}

Carrier: {{carrier_name}}
Policy: {{policy_number}}
Claim: {{insurer_claim_number}}
Loss: {{loss_type}} on {{date_of_loss}}
Property: {{property_address}}

Settlement date: {{settlement_date}}
Gross settlement: {{settlement_amount}}
Contracted contingency: {{contingency_fee_percent}}
Fee earned: {{fee_earned}}
Net to client: {{client_disbursement}}

This statement is prepared from BLACKBOX claim figures and will match the BLACKLEDGER payout record once the settlement or release is executed. If a partner split applies (BLACKGATE referral), that split is calculated in BLACKLEDGER and is not deducted on this client statement unless separately disclosed.

Prepared {{today}} by {{adjuster_name}}, License {{adjuster_license}}.

Client acknowledgment: ___________________________  Date: ________
`,
  },
  {
    documentType: "FEE_INVOICE",
    name: "Contingency fee invoice",
    description: "Invoice tied to the BLACKLEDGER payout record.",
    stage: "RESOLUTION",
    required: true,
    aobOnly: false,
    sortOrder: 40,
    claimStatuses: ["SETTLED", "CLOSED"],
    body: `INVOICE — CONTINGENCY FEE
{{firm_name}}
{{firm_address}}
{{firm_email}} · {{firm_phone}}

Invoice date: {{today}}
Bill to: {{claimant_name}}
{{claimant_mailing_address}}

File {{claim_number}} · Intake {{intake_number}}
{{carrier_name}} · Policy {{policy_number}} · Claim {{insurer_claim_number}}
{{loss_type}} · {{date_of_loss}} · {{property_address}}

Description                                          Amount
Settlement proceeds                                  {{settlement_amount}}
Public adjuster contingency ({{contingency_fee_percent}})     {{fee_earned}}

Amount due to {{firm_name}}: {{fee_earned}}
Amount payable to client: {{client_disbursement}}

This invoice is generated when the settlement or release is executed and is linked to the BLACKLEDGER payout queue. Remit per the closing statement. Fla. Stat. § 626.854.

{{adjuster_name}} · License {{adjuster_license}}
`,
  },
  {
    documentType: "EXTENSION_REQUEST",
    name: "Extension request letter",
    description: "Request additional time from the carrier or insured.",
    stage: "ADMINISTRATIVE",
    required: false,
    aobOnly: false,
    sortOrder: 10,
    claimStatuses: [
      "INTAKE",
      "UNDER_REVIEW",
      "INVESTIGATION",
      "FILED",
      "NEGOTIATING",
    ],
    body: `{{today}}

{{carrier_name}}
Attn: {{desk_examiner_name}}
Re: Request for Extension
{{claimant_name}} · {{claim_number}} · {{insurer_claim_number}}
Policy {{policy_number}} · {{property_address}} · DOL {{date_of_loss}}

Dear {{desk_examiner_name}}:

We request a reasonable extension of time to submit or supplement documentation on this {{loss_type}} claim. Additional inspection detail is being completed (BLACKMIRROR photo count {{photo_count}}; current scope: {{scope_summary}}).

Please confirm the extended date in writing and continue to direct correspondence to this office.

{{adjuster_name}}, License {{adjuster_license}}
{{firm_name}}
`,
  },
  {
    documentType: "WITHDRAWAL",
    name: "Withdrawal of representation",
    description: "Withdraws representation if the file is dropped.",
    stage: "ADMINISTRATIVE",
    required: false,
    aobOnly: false,
    sortOrder: 20,
    claimStatuses: [
      "INTAKE",
      "UNDER_REVIEW",
      "INVESTIGATION",
      "FILED",
      "NEGOTIATING",
      "DENIED",
      "CLOSED",
    ],
    body: `{{today}}

{{carrier_name}}
Attn: {{desk_examiner_name}}
and
{{claimant_name}}
{{claimant_mailing_address}}

Re: Withdrawal of Representation
File {{claim_number}} · Policy {{policy_number}} · Claim {{insurer_claim_number}}
{{property_address}} · DOL {{date_of_loss}}

Please be advised that {{firm_name}} withdraws as public adjuster of record for {{claimant_name}} on the above claim, effective {{today}}.

The carrier should resume direct communication with the insured at {{claimant_email}} / {{claimant_phone}}. This withdrawal does not waive any fee earned for work already performed to the extent permitted by contract and Fla. Stat. § 626.854.

{{adjuster_name}}, License {{adjuster_license}}
{{firm_name}}
`,
  },
  {
    documentType: "STATUS_UPDATE",
    name: "Client status update",
    description: "Periodic non-legal correspondence to the client.",
    stage: "ADMINISTRATIVE",
    required: false,
    aobOnly: false,
    sortOrder: 30,
    claimStatuses: [
      "INTAKE",
      "UNDER_REVIEW",
      "INVESTIGATION",
      "FILED",
      "NEGOTIATING",
      "SETTLED",
    ],
    body: `{{today}}

{{claimant_name}}
{{claimant_mailing_address}}

Re: Status update — File {{claim_number}}
{{carrier_name}} · {{insurer_claim_number}} · {{property_address}}

{{claimant_first_name}},

This is a status update, not legal advice.

Your {{loss_type}} claim from {{date_of_loss}} remains open with {{carrier_name}}. Current working figures: estimate {{estimated_value}}, demand {{demand_amount}}, settlement {{settlement_amount}}. Field documentation on file: {{photo_count}} photographs. Scope: {{scope_summary}}

Your assigned public adjuster is {{adjuster_name}} (License {{adjuster_license}}). Reply to this letter or call {{firm_phone}} if your contact information has changed.

Thank you,
{{adjuster_name}}
{{firm_name}}
`,
  },
];

export function catalogByType(type: DocumentType): CatalogEntry | undefined {
  return TEMPLATE_CATALOG.find((t) => t.documentType === type);
}
