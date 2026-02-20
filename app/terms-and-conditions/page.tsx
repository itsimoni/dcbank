"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function TermsAndConditionsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#b91c1c] text-white py-8">
        <div className="max-w-4xl mx-auto px-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-white hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Terms and Conditions</h1>
          <p className="text-red-100 mt-2">Last Updated: January 1, 2027</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. ACCEPTANCE OF TERMS</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              These Terms and Conditions ("Terms", "Agreement") constitute a legally binding agreement between you ("User", "Customer", "you", or "your") and Malta Crypto Central Bank ("MCCB", "Bank", "Company", "we", "us", or "our"), a financial institution duly licensed and regulated under applicable banking laws and regulations.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              By accessing, browsing, or using our digital banking platform, mobile applications, websites, or any related services (collectively, the "Services"), you acknowledge that you have read, understood, and agree to be bound by these Terms in their entirety. If you do not agree to these Terms, you must immediately discontinue use of our Services.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Your continued use of the Services following any modifications to these Terms shall constitute your acceptance of such modifications. We reserve the right to modify, amend, or update these Terms at any time, with or without prior notice, and such changes shall be effective immediately upon posting to our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. DEFINITIONS AND INTERPRETATION</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For the purposes of this Agreement, the following terms shall have the meanings ascribed to them below:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>"Account"</strong> means any banking account, including but not limited to current accounts, savings accounts, fixed deposit accounts, and any other account type offered by MCCB.</li>
              <li><strong>"Authorized User"</strong> means any individual who has been granted permission by the primary Account holder to access and operate the Account.</li>
              <li><strong>"Business Day"</strong> means any day other than a Saturday, Sunday, or public holiday in the jurisdiction where our principal office is located.</li>
              <li><strong>"Confidential Information"</strong> means any non-public information relating to a party's business, operations, technology, customers, or financial affairs.</li>
              <li><strong>"Electronic Instructions"</strong> means any instruction, request, or communication transmitted through our digital platforms, including but not limited to fund transfers, payment orders, and account management requests.</li>
              <li><strong>"Force Majeure Event"</strong> means any event beyond the reasonable control of either party, including but not limited to natural disasters, acts of war, terrorism, civil unrest, governmental actions, or system failures.</li>
              <li><strong>"Personal Data"</strong> means any information relating to an identified or identifiable natural person, as defined under applicable data protection legislation.</li>
              <li><strong>"Transaction"</strong> means any financial operation conducted through the Services, including deposits, withdrawals, transfers, payments, and currency exchanges.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">3. ELIGIBILITY AND ACCOUNT OPENING</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              3.1 <strong>Age Requirement:</strong> You must be at least eighteen (18) years of age, or the age of majority in your jurisdiction of residence, whichever is higher, to open an Account and use our Services. By registering for an Account, you represent and warrant that you meet this age requirement.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              3.2 <strong>Legal Capacity:</strong> You must have the legal capacity to enter into binding contracts under the laws of your jurisdiction. Persons who are legally incapacitated, bankrupt, or otherwise prohibited from entering into financial agreements are not permitted to use our Services.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              3.3 <strong>Identity Verification:</strong> As part of our regulatory obligations under anti-money laundering (AML) and know-your-customer (KYC) requirements, you agree to provide accurate, current, and complete identification documents and information as requested. This may include, but is not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Government-issued photo identification (passport, national ID card, driver's license)</li>
              <li>Proof of residential address (utility bills, bank statements, official correspondence)</li>
              <li>Tax identification numbers and related documentation</li>
              <li>Source of funds documentation</li>
              <li>Employment or business verification documents</li>
              <li>Additional documentation as may be required by regulatory authorities</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              3.4 <strong>Account Approval:</strong> We reserve the absolute right to accept or reject any application for an Account at our sole discretion, without obligation to provide reasons for such decision. We may also impose conditions on Account opening or limit the Services available to you.
            </p>
            <p className="text-gray-700 leading-relaxed">
              3.5 <strong>Ongoing Verification:</strong> You acknowledge that identity verification is not a one-time process. We may periodically request updated documentation and information to maintain compliance with regulatory requirements. Failure to provide requested information within the specified timeframe may result in Account restrictions or closure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">4. ACCOUNT MANAGEMENT AND SECURITY</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              4.1 <strong>Account Credentials:</strong> You are solely responsible for maintaining the confidentiality and security of your Account credentials, including but not limited to usernames, passwords, personal identification numbers (PINs), security questions, and any other authentication factors. You agree not to share these credentials with any third party.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              4.2 <strong>Unauthorized Access:</strong> You must immediately notify us upon becoming aware of any unauthorized access to your Account or any suspected security breach. Such notification must be made through our official customer service channels. Until we receive such notification and have had reasonable opportunity to act upon it, you shall be liable for all Transactions conducted through your Account.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              4.3 <strong>Multi-Factor Authentication:</strong> We may require the use of multi-factor authentication for certain Transactions or Account activities. You agree to comply with all security measures implemented by us, even if such measures may cause inconvenience or delay.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              4.4 <strong>Device Security:</strong> You are responsible for ensuring the security of any device used to access our Services. This includes maintaining up-to-date antivirus software, avoiding use of public or unsecured networks for banking activities, and immediately reporting any lost or stolen devices that may have access to your Account.
            </p>
            <p className="text-gray-700 leading-relaxed">
              4.5 <strong>Account Statements:</strong> You agree to review all Account statements, Transaction confirmations, and other communications from us promptly. Any discrepancies or unauthorized Transactions must be reported within thirty (30) days of the statement date. Failure to report within this period may limit your ability to dispute such Transactions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">5. BANKING SERVICES AND TRANSACTIONS</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              5.1 <strong>Fund Transfers:</strong> We provide various fund transfer services, including domestic transfers, international wire transfers (SWIFT), Single Euro Payments Area (SEPA) transfers, and internal transfers between MCCB Accounts. Each transfer type is subject to its own processing times, fees, and limitations as published on our platform.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              5.2 <strong>Transfer Limits:</strong> Daily, weekly, and monthly transfer limits apply to all Accounts. These limits may vary based on Account type, verification level, and transaction history. We reserve the right to modify these limits at any time, with or without notice.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              5.3 <strong>Processing Times:</strong> While we endeavor to process all Transactions promptly, processing times may vary depending on the type of Transaction, recipient institution, and external factors beyond our control. Estimated processing times are provided for guidance only and do not constitute guarantees.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              5.4 <strong>Irrevocability:</strong> Certain Transactions, once initiated and confirmed, may be irrevocable. You acknowledge that we may not be able to cancel, reverse, or modify a Transaction after it has been processed, particularly for international transfers.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              5.5 <strong>Currency Exchange:</strong> For Transactions involving currency conversion, the exchange rate applied will be our prevailing rate at the time of processing, which may differ from the rate displayed at the time of Transaction initiation. You accept the risk of exchange rate fluctuations.
            </p>
            <p className="text-gray-700 leading-relaxed">
              5.6 <strong>Beneficiary Information:</strong> You are solely responsible for providing accurate beneficiary information. We shall not be liable for any loss, delay, or failure arising from incorrect or incomplete beneficiary details provided by you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">6. FEES, CHARGES, AND INTEREST</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              6.1 <strong>Fee Schedule:</strong> Our current fee schedule is published on our platform and forms an integral part of this Agreement. You agree to pay all applicable fees associated with your Account and use of Services.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              6.2 <strong>Fee Modifications:</strong> We reserve the right to introduce new fees or modify existing fees at any time. For material changes, we will provide at least thirty (30) days' notice through our platform or other communication channels. Your continued use of Services after such notice constitutes acceptance of the modified fees.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              6.3 <strong>Third-Party Fees:</strong> Certain Transactions may incur fees from third-party institutions, including correspondent banks, intermediary banks, or beneficiary banks. These fees are beyond our control and will be deducted from the transferred amount or charged separately.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              6.4 <strong>Interest Rates:</strong> Interest rates applicable to deposit accounts and credit facilities are subject to change based on market conditions and regulatory requirements. Current rates are published on our platform.
            </p>
            <p className="text-gray-700 leading-relaxed">
              6.5 <strong>Fee Deduction:</strong> You authorize us to deduct applicable fees directly from your Account without further notice or consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">7. PROHIBITED ACTIVITIES AND COMPLIANCE</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              7.1 <strong>Prohibited Uses:</strong> You agree not to use our Services for any of the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Money laundering, terrorist financing, or other financial crimes</li>
              <li>Fraud, theft, embezzlement, or any other criminal activity</li>
              <li>Transactions involving proceeds of illegal activities</li>
              <li>Circumventing economic sanctions, trade restrictions, or embargoes</li>
              <li>Tax evasion or other violations of tax laws</li>
              <li>Transactions with sanctioned individuals, entities, or jurisdictions</li>
              <li>Operating illegal gambling or gaming operations</li>
              <li>Trafficking in controlled substances, weapons, or human beings</li>
              <li>Child exploitation or distribution of illegal content</li>
              <li>Any activity that violates applicable laws or regulations</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              7.2 <strong>Sanctions Compliance:</strong> You represent and warrant that you are not, and will not become, a person or entity subject to economic sanctions administered by the United Nations, European Union, United States (OFAC), United Kingdom, or any other relevant jurisdiction.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              7.3 <strong>Reporting Obligations:</strong> We are legally obligated to report suspicious activities to relevant authorities. You acknowledge that we may do so without notifying you and that such reporting does not constitute a breach of confidentiality.
            </p>
            <p className="text-gray-700 leading-relaxed">
              7.4 <strong>Consequences of Violation:</strong> Violation of these prohibitions may result in immediate Account suspension or closure, reporting to law enforcement authorities, and civil or criminal liability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">8. INTELLECTUAL PROPERTY RIGHTS</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              8.1 <strong>Ownership:</strong> All intellectual property rights in and to our Services, including but not limited to software, platforms, applications, websites, trademarks, logos, designs, content, and documentation, are owned exclusively by MCCB or our licensors.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              8.2 <strong>Limited License:</strong> Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use our Services solely for personal, non-commercial banking purposes.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              8.3 <strong>Restrictions:</strong> You may not copy, modify, distribute, sell, lease, reverse engineer, decompile, or create derivative works based on our Services or any component thereof without our prior written consent.
            </p>
            <p className="text-gray-700 leading-relaxed">
              8.4 <strong>Feedback:</strong> Any feedback, suggestions, or ideas you provide regarding our Services shall become our exclusive property, and we may use such feedback without compensation or attribution.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">9. LIMITATION OF LIABILITY</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              9.1 <strong>Service Availability:</strong> WHILE WE ENDEAVOR TO MAINTAIN CONTINUOUS SERVICE AVAILABILITY, WE DO NOT GUARANTEE UNINTERRUPTED ACCESS TO OUR SERVICES. OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              9.2 <strong>Exclusion of Liability:</strong> TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, MCCB SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              9.3 <strong>Liability Cap:</strong> IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO THESE TERMS OR YOUR USE OF SERVICES EXCEED THE GREATER OF (A) THE FEES PAID BY YOU IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED EUROS (EUR 100).
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              9.4 <strong>Third-Party Actions:</strong> We shall not be liable for any acts or omissions of third parties, including correspondent banks, payment networks, telecommunications providers, or governmental authorities.
            </p>
            <p className="text-gray-700 leading-relaxed">
              9.5 <strong>Force Majeure:</strong> We shall not be liable for any delay or failure to perform our obligations under these Terms if such delay or failure results from a Force Majeure Event.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">10. INDEMNIFICATION</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree to indemnify, defend, and hold harmless MCCB, its parent company, subsidiaries, affiliates, officers, directors, employees, agents, and licensors from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Your use of or access to the Services</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any applicable law or regulation</li>
              <li>Your violation of any third-party rights</li>
              <li>Any content or information you submit through the Services</li>
              <li>Any claim that your use of Services caused damage to a third party</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">11. ACCOUNT SUSPENSION AND TERMINATION</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              11.1 <strong>Suspension Rights:</strong> We may suspend or restrict your access to Services, in whole or in part, immediately and without prior notice if:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>We suspect unauthorized access or fraudulent activity</li>
              <li>We are required to do so by law or regulatory authority</li>
              <li>We believe you have violated these Terms</li>
              <li>Your Account shows unusual or suspicious activity</li>
              <li>You fail to provide requested documentation</li>
              <li>We determine it necessary to protect our interests or those of other customers</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              11.2 <strong>Termination by You:</strong> You may terminate your Account at any time by providing written notice through our official channels. Account closure is subject to settlement of all outstanding obligations and completion of pending Transactions.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              11.3 <strong>Termination by Us:</strong> We may terminate your Account at any time for any reason upon thirty (30) days' notice, or immediately in cases of suspected fraud, legal requirements, or material breach of these Terms.
            </p>
            <p className="text-gray-700 leading-relaxed">
              11.4 <strong>Effect of Termination:</strong> Upon termination, any remaining balance in your Account will be transferred to a designated account or made available for withdrawal, subject to applicable fees and legal holds.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">12. DISPUTE RESOLUTION</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              12.1 <strong>Informal Resolution:</strong> Before initiating any formal dispute resolution proceeding, you agree to first attempt to resolve any dispute informally by contacting our customer service department.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              12.2 <strong>Governing Law:</strong> These Terms shall be governed by and construed in accordance with the laws of Malta and applicable European Union regulations, without regard to its conflict of law principles.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              12.3 <strong>Jurisdiction:</strong> Any disputes arising from or relating to these Terms or your use of Services shall be subject to the exclusive jurisdiction of the courts of Malta.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              12.4 <strong>Arbitration:</strong> Alternatively, at our sole discretion, disputes may be resolved through binding arbitration administered by the Malta Arbitration Centre in accordance with its rules.
            </p>
            <p className="text-gray-700 leading-relaxed">
              12.5 <strong>Class Action Waiver:</strong> YOU AGREE TO RESOLVE DISPUTES WITH US ON AN INDIVIDUAL BASIS AND WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION, CLASS-WIDE ARBITRATION, OR ANY OTHER REPRESENTATIVE PROCEEDING.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">13. DATA PROTECTION AND PRIVACY</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              13.1 <strong>Privacy Policy:</strong> Our collection, use, and disclosure of your Personal Data are governed by our Privacy Policy, which is incorporated into these Terms by reference.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              13.2 <strong>Consent:</strong> By using our Services, you consent to the collection, processing, and transfer of your Personal Data as described in our Privacy Policy.
            </p>
            <p className="text-gray-700 leading-relaxed">
              13.3 <strong>Data Retention:</strong> We retain your data for as long as necessary to fulfill the purposes for which it was collected, comply with legal obligations, resolve disputes, and enforce our agreements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">14. ELECTRONIC COMMUNICATIONS</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              14.1 <strong>Consent to Electronic Communications:</strong> By using our Services, you consent to receive communications from us electronically, including emails, SMS messages, push notifications, and in-app messages.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              14.2 <strong>Legal Effect:</strong> You agree that all agreements, notices, disclosures, and other communications provided electronically satisfy any legal requirement that such communications be in writing.
            </p>
            <p className="text-gray-700 leading-relaxed">
              14.3 <strong>Contact Information:</strong> You are responsible for maintaining accurate contact information in your Account. We are not responsible for communications that fail to reach you due to outdated or incorrect contact information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">15. MISCELLANEOUS PROVISIONS</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              15.1 <strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy and any other policies referenced herein, constitute the entire agreement between you and MCCB regarding the Services.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              15.2 <strong>Severability:</strong> If any provision of these Terms is held to be invalid, illegal, or unenforceable, such provision shall be modified to the minimum extent necessary to make it valid and enforceable, and the remaining provisions shall continue in full force and effect.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              15.3 <strong>Waiver:</strong> Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              15.4 <strong>Assignment:</strong> You may not assign or transfer your rights or obligations under these Terms without our prior written consent. We may freely assign our rights and obligations.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              15.5 <strong>No Third-Party Beneficiaries:</strong> These Terms do not create any third-party beneficiary rights except as expressly provided herein.
            </p>
            <p className="text-gray-700 leading-relaxed">
              15.6 <strong>Headings:</strong> Section headings are for convenience only and shall not affect the interpretation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">16. REGULATORY INFORMATION</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Malta Crypto Central Bank is a licensed financial institution authorized and regulated by the Malta Financial Services Authority (MFSA) under the Virtual Financial Assets Act (VFA Act) and the Financial Institutions Act. Our license number is VFA/2024/001. We are a member of the Malta Bankers' Association and participate in the Depositor Compensation Scheme.
            </p>
            <p className="text-gray-700 leading-relaxed">
              For regulatory complaints or inquiries, you may contact the MFSA directly at their official website (www.mfsa.mt) or registered address at Triq l-Imdina, Zone 1, Central Business District, Birkirkara CBD 1010, Malta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">17. CONTACT INFORMATION</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions, concerns, or complaints regarding these Terms or our Services, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-gray-700">
              <p><strong>Malta Crypto Central Bank</strong></p>
              <p>171 Old Bakery Street</p>
              <p>VLT 1455 Valletta, Malta</p>
              <p className="mt-2">Email: legal@mccb.mt</p>
              <p>Phone: +356 2122 0000</p>
              <p className="mt-2">Customer Service Hours: Monday - Friday, 09:00 - 18:00 CET</p>
            </div>
          </section>

          <div className="border-t border-gray-200 pt-8 mt-8">
            <p className="text-sm text-gray-500 text-center">
              By using Malta Crypto Central Bank, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
            </p>
            <p className="text-sm text-gray-500 text-center mt-2">
              Document Version: 2.4.1 | Effective Date: January 1, 2027
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
