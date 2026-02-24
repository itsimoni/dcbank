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
          <p className="text-red-100 mt-2">Last Updated: February 24, 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white shadow-sm border border-gray-200 p-8 space-y-8">

          <section className="bg-red-50 border border-red-200 p-6">
            <h2 className="text-lg font-bold text-[#b91c1c] mb-3">IMPORTANT NOTICE - PLEASE READ CAREFULLY</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms and Conditions constitute a legally binding agreement between you and Malta Global Crypto Bank. By clicking "Create Account," checking the acceptance box, or otherwise registering for our services, you acknowledge that you have read, understood, and agree to be bound by all terms contained herein. If you do not agree to these terms in their entirety, you must not proceed with account registration.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. DEFINITIONS AND INTERPRETATION</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              1.1 In these Terms and Conditions ("Terms", "Agreement"), unless the context otherwise requires, the following expressions shall have the following meanings:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>"Account"</strong> means any banking account opened and maintained with Malta Global Crypto Bank, including current accounts, savings accounts, fixed deposit accounts, cryptocurrency wallets, and any other account type offered by the Bank.</li>
              <li><strong>"Applicant"</strong> means any natural or legal person applying to open an Account with the Bank.</li>
              <li><strong>"Authorised User"</strong> means any individual who has been granted permission by the primary Account holder to access and operate the Account in accordance with the authority granted.</li>
              <li><strong>"Bank", "MGCB", "we", "us", "our"</strong> means Malta Global Crypto Bank, a credit institution duly licensed and regulated under the laws of Malta.</li>
              <li><strong>"Business Day"</strong> means any day other than a Saturday, Sunday, or public holiday in Malta, on which banks are open for general banking business.</li>
              <li><strong>"Confidential Information"</strong> means any non-public information relating to a party's business, operations, technology, customers, or financial affairs.</li>
              <li><strong>"Customer", "you", "your"</strong> means any person who has successfully completed the Account opening process and has been accepted as a customer of the Bank.</li>
              <li><strong>"Digital Assets"</strong> means cryptocurrencies, virtual assets, tokens, and any other digital representations of value that may be traded or transferred electronically.</li>
              <li><strong>"Electronic Instructions"</strong> means any instruction, request, or communication transmitted through our digital platforms, including but not limited to fund transfers, payment orders, and account management requests.</li>
              <li><strong>"Force Majeure Event"</strong> means any event beyond the reasonable control of either party, including but not limited to acts of God, natural disasters, epidemics, pandemics, acts of war or terrorism, civil unrest, governmental actions, regulatory changes, system failures, or telecommunications outages.</li>
              <li><strong>"KYC"</strong> means Know Your Customer requirements under applicable anti-money laundering and counter-terrorist financing legislation.</li>
              <li><strong>"MFSA"</strong> means the Malta Financial Services Authority, being the regulatory authority responsible for licensing and supervising the Bank.</li>
              <li><strong>"Personal Data"</strong> means any information relating to an identified or identifiable natural person, as defined under the General Data Protection Regulation (EU) 2016/679 and applicable data protection legislation.</li>
              <li><strong>"Services"</strong> means all banking and financial services offered by the Bank, including but not limited to account services, payment services, cryptocurrency services, and any related digital platform services.</li>
              <li><strong>"Transaction"</strong> means any financial operation conducted through the Services, including deposits, withdrawals, transfers, payments, exchanges, and any other operations affecting Account balances.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              1.2 In these Terms: (a) words importing the singular include the plural and vice versa; (b) words importing any gender include all genders; (c) references to persons include natural persons, bodies corporate, unincorporated associations, and partnerships; (d) headings are for convenience only and shall not affect interpretation; (e) references to legislation include any modification, amendment, extension, consolidation, or re-enactment thereof.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. ACCEPTANCE OF TERMS AND ACCOUNT REGISTRATION</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              2.1 <strong>Legal Agreement:</strong> These Terms constitute a legally binding agreement between you and Malta Global Crypto Bank. By registering for an Account, you enter into a contractual relationship with the Bank governed by these Terms, applicable laws, and regulations.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              2.2 <strong>Acceptance Mechanism:</strong> Your acceptance of these Terms is manifested by: (a) checking the acceptance checkbox during the registration process; (b) clicking any button or link indicating acceptance; (c) completing the Account registration process; (d) using any of our Services after registration.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              2.3 <strong>Capacity to Contract:</strong> By registering for an Account, you represent and warrant that: (a) you have the legal capacity to enter into binding contracts under the laws of your jurisdiction; (b) you are not legally incapacitated, bankrupt, or otherwise prohibited from entering into financial agreements; (c) if acting on behalf of a legal entity, you have the authority to bind such entity to these Terms.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              2.4 <strong>Modifications to Terms:</strong> We reserve the right to modify, amend, supplement, or replace these Terms at any time. Material changes will be notified to you at least thirty (30) days in advance through our digital platform, email, or other communication channels. Your continued use of Services after such notification constitutes acceptance of the modified Terms. If you do not agree to any modifications, you must close your Account before the effective date of such modifications.
            </p>
            <p className="text-gray-700 leading-relaxed">
              2.5 <strong>Supplementary Documents:</strong> These Terms should be read in conjunction with our Privacy Policy, Fee Schedule, Product Terms, and any other policies or documents referenced herein, all of which form an integral part of this Agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">3. ELIGIBILITY REQUIREMENTS FOR ACCOUNT REGISTRATION</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              3.1 <strong>Age Requirement:</strong> To register for an Account, you must be at least eighteen (18) years of age, or the age of majority in your jurisdiction of residence, whichever is higher. The Bank does not offer Accounts to minors. By registering, you represent and warrant that you meet this age requirement.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              3.2 <strong>Residency and Jurisdiction:</strong> Our Services are available to residents of the European Economic Area (EEA) and certain other jurisdictions approved by the Bank. We do not offer Services to residents of countries subject to comprehensive sanctions or where our Services are prohibited by local law. The Bank reserves the right to restrict or decline Services based on jurisdictional considerations.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              3.3 <strong>Prohibited Persons:</strong> You may not register for an Account if you are: (a) a person or entity subject to economic sanctions administered by the United Nations, European Union, United States (OFAC), United Kingdom, or any other relevant jurisdiction; (b) a politically exposed person (PEP) without prior disclosure and approval; (c) associated with any designated terrorist organization; (d) convicted of financial crimes, money laundering, fraud, or related offenses; (e) previously had an Account terminated by us for cause.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              3.4 <strong>Single Account Policy:</strong> Unless expressly authorised, each individual may maintain only one personal Account with the Bank. Opening multiple Accounts using different identities, false information, or other deceptive means is strictly prohibited and may result in Account termination and reporting to authorities.
            </p>
            <p className="text-gray-700 leading-relaxed">
              3.5 <strong>Corporate and Business Accounts:</strong> Legal entities seeking to open Accounts must provide additional documentation including certificate of incorporation, memorandum and articles of association, register of directors and shareholders, ultimate beneficial ownership information, and any other documentation required for enhanced due diligence.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">4. KNOW YOUR CUSTOMER (KYC) AND IDENTITY VERIFICATION</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              4.1 <strong>Regulatory Obligation:</strong> As a regulated financial institution, the Bank is legally obligated to verify the identity of all customers and conduct ongoing due diligence in accordance with anti-money laundering (AML), counter-terrorist financing (CTF), and know-your-customer (KYC) requirements under Maltese law, EU directives, and international standards.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              4.2 <strong>Required Documentation:</strong> As part of the Account registration process, you agree to provide accurate, current, and complete documentation, which may include but is not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Valid government-issued photo identification (passport, national identity card, or driver's license)</li>
              <li>Proof of residential address dated within the last three (3) months (utility bills, bank statements, government correspondence, or rental agreements)</li>
              <li>Tax identification number and certificate of tax residency where applicable</li>
              <li>Source of funds documentation demonstrating the legitimate origin of funds to be deposited</li>
              <li>Source of wealth documentation for high-value customers or enhanced due diligence cases</li>
              <li>Employment verification or business registration documents</li>
              <li>Selfie photograph or video verification for identity confirmation</li>
              <li>Additional documentation as may be required by our compliance department or regulatory authorities</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              4.3 <strong>Verification Process:</strong> You acknowledge and accept that: (a) Account registration is subject to successful completion of our KYC verification process; (b) verification may take several Business Days depending on documentation quality and complexity; (c) we may use third-party identity verification services; (d) additional verification steps may be required at our discretion; (e) your Account may have limited functionality until verification is completed.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              4.4 <strong>Accuracy of Information:</strong> You represent and warrant that all information and documentation provided during registration and thereafter is true, accurate, complete, and not misleading. You agree to notify us immediately of any changes to your personal information, contact details, tax status, or other relevant circumstances.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              4.5 <strong>Ongoing Due Diligence:</strong> Identity verification is not a one-time process. We may periodically request updated documentation and information to maintain compliance with regulatory requirements. You agree to provide such documentation within the timeframe specified. Failure to comply may result in Account restrictions, suspension, or closure.
            </p>
            <p className="text-gray-700 leading-relaxed">
              4.6 <strong>Enhanced Due Diligence:</strong> Certain customers may be subject to enhanced due diligence measures based on risk assessment, including but not limited to politically exposed persons (PEPs), high-risk jurisdictions, complex ownership structures, or high-value transactions. Additional documentation and ongoing monitoring requirements may apply.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">5. ACCOUNT OPENING AND APPROVAL</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              5.1 <strong>Application Process:</strong> To open an Account, you must: (a) complete the online registration form with all required information; (b) accept these Terms and Conditions; (c) provide all required identity verification documentation; (d) successfully complete the KYC verification process; (e) receive written confirmation of Account approval from the Bank.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              5.2 <strong>Approval Discretion:</strong> We reserve the absolute right to accept or reject any Account application at our sole discretion, without obligation to provide reasons for such decision. Factors that may influence our decision include, but are not limited to, risk assessment outcomes, regulatory requirements, jurisdictional restrictions, and business considerations.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              5.3 <strong>Conditional Approval:</strong> We may approve your Account subject to certain conditions, limitations, or restrictions, including but not limited to: (a) lower transaction limits; (b) restricted access to certain Services; (c) requirement for additional documentation; (d) enhanced monitoring; (e) periodic review and reassessment.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              5.4 <strong>Account Activation:</strong> Your Account will be activated upon successful completion of all verification requirements and receipt of Account approval. You will receive confirmation of activation along with your Account details and instructions for accessing our Services.
            </p>
            <p className="text-gray-700 leading-relaxed">
              5.5 <strong>No Obligation:</strong> Submission of a registration application does not guarantee Account approval. The Bank is not obligated to open an Account for any applicant and shall not be liable for any loss, damage, or inconvenience arising from rejection of an application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">6. ACCOUNT CREDENTIALS AND SECURITY</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              6.1 <strong>Credential Responsibility:</strong> You are solely and exclusively responsible for maintaining the confidentiality and security of your Account credentials, including but not limited to: (a) username and password; (b) personal identification numbers (PINs); (c) security questions and answers; (d) two-factor authentication codes; (e) biometric data used for authentication; (f) any other authentication factors or security codes.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              6.2 <strong>Prohibition on Sharing:</strong> You must not share, disclose, transfer, or permit access to your Account credentials to any third party under any circumstances. The Bank will never ask you for your password, PIN, or complete security codes through email, telephone, or any other channel.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              6.3 <strong>Strong Password Requirements:</strong> You agree to create and maintain a strong, unique password for your Account that: (a) is at least eight (8) characters in length; (b) contains a combination of uppercase and lowercase letters, numbers, and special characters; (c) is not easily guessable or derived from personal information; (d) is not used for any other accounts or services; (e) is changed periodically as recommended by security best practices.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              6.4 <strong>Multi-Factor Authentication:</strong> We may require the use of multi-factor authentication (MFA) for Account access and certain transactions. You agree to enable and maintain MFA as required, and acknowledge that MFA adds an essential layer of security to your Account.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              6.5 <strong>Reporting Unauthorized Access:</strong> You must immediately notify us upon becoming aware of or suspecting: (a) any unauthorized access to your Account; (b) any unauthorized Transaction; (c) any security breach affecting your Account credentials; (d) loss or theft of any device used to access your Account; (e) any suspicious activity related to your Account. Notification must be made through our official customer service channels.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              6.6 <strong>Liability for Unauthorized Transactions:</strong> Until we receive notification of unauthorized access or security breach and have had reasonable opportunity to act upon it, you shall be liable for all Transactions conducted through your Account using your credentials. We may limit your liability for unauthorized Transactions in accordance with applicable consumer protection laws, provided you have not acted fraudulently or with gross negligence.
            </p>
            <p className="text-gray-700 leading-relaxed">
              6.7 <strong>Device Security:</strong> You are responsible for ensuring the security of any device (computer, smartphone, tablet, etc.) used to access our Services, including: (a) maintaining up-to-date operating systems and security patches; (b) installing and maintaining reputable antivirus and anti-malware software; (c) avoiding use of public or unsecured Wi-Fi networks for banking activities; (d) logging out of your Account after each session; (e) not storing credentials on shared or public devices.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">7. BANKING SERVICES AND OPERATIONS</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              7.1 <strong>Available Services:</strong> Subject to these Terms and applicable product terms, the Bank offers various banking and financial services, including but not limited to: (a) current and savings accounts in multiple currencies; (b) payment and transfer services (SEPA, SWIFT, internal transfers); (c) debit card services; (d) cryptocurrency custody and exchange services; (e) digital banking platform access; (f) account statements and reporting; (g) such other services as may be introduced from time to time.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              7.2 <strong>Service Availability:</strong> While we endeavor to maintain continuous availability of our Services, we do not guarantee uninterrupted access. Services may be temporarily unavailable due to: (a) scheduled maintenance; (b) system upgrades or updates; (c) technical difficulties or failures; (d) Force Majeure Events; (e) regulatory requirements; (f) security concerns.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              7.3 <strong>Transaction Processing:</strong> Transactions initiated through our platform will be processed in accordance with our standard processing times, which may vary depending on: (a) the type of Transaction; (b) the currencies involved; (c) the recipient institution; (d) regulatory requirements; (e) time of submission. Estimated processing times are provided for guidance only and do not constitute guarantees.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              7.4 <strong>Transaction Limits:</strong> All Accounts are subject to daily, weekly, and monthly transaction limits as published on our platform. Limits may vary based on Account type, verification level, and transaction history. We reserve the right to modify limits at any time.
            </p>
            <p className="text-gray-700 leading-relaxed">
              7.5 <strong>Right to Refuse Transactions:</strong> We reserve the right to refuse, delay, or reverse any Transaction if we reasonably believe that: (a) the Transaction may be fraudulent or unauthorized; (b) the Transaction may violate applicable laws or regulations; (c) processing would expose us to regulatory, reputational, or financial risk; (d) there are insufficient funds in your Account; (e) you have violated these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">8. FEES, CHARGES, AND INTEREST</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              8.1 <strong>Fee Schedule:</strong> Our current fee schedule is published on our platform and forms an integral part of this Agreement. You agree to pay all applicable fees associated with your Account and use of Services as set out in the fee schedule.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              8.2 <strong>Account Fees:</strong> Depending on your Account type, you may be subject to: (a) account opening fees; (b) monthly or annual maintenance fees; (c) minimum balance fees; (d) inactivity fees; (e) account closure fees; (f) statement or certificate fees.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              8.3 <strong>Transaction Fees:</strong> Transactions may incur fees including but not limited to: (a) domestic transfer fees; (b) international wire transfer fees; (c) currency conversion fees and spreads; (d) expedited processing fees; (e) card transaction fees; (f) ATM withdrawal fees.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              8.4 <strong>Third-Party Fees:</strong> Certain Transactions may incur fees from third-party institutions, including correspondent banks, intermediary banks, payment networks, or beneficiary banks. These fees are beyond our control and will be deducted from the transferred amount or charged separately as applicable.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              8.5 <strong>Fee Modifications:</strong> We reserve the right to introduce new fees or modify existing fees at any time. For material changes, we will provide at least thirty (30) days' notice. Your continued use of Services after such notice constitutes acceptance of the modified fees.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              8.6 <strong>Fee Deduction Authorization:</strong> You authorize us to deduct applicable fees, charges, and any amounts owed to us directly from your Account without further notice or consent.
            </p>
            <p className="text-gray-700 leading-relaxed">
              8.7 <strong>Interest:</strong> Interest rates applicable to deposit accounts are published on our platform and may change from time to time based on market conditions and regulatory requirements. Interest calculation methods and payment frequencies are specified in the relevant product terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">9. PROHIBITED ACTIVITIES AND COMPLIANCE</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              9.1 <strong>Prohibited Uses:</strong> You agree that you will not use your Account or our Services for any of the following purposes, which are strictly prohibited:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Money laundering, terrorist financing, proliferation financing, or any other financial crime</li>
              <li>Fraud, theft, embezzlement, bribery, corruption, or any other criminal activity</li>
              <li>Transactions involving proceeds of illegal activities or criminal enterprises</li>
              <li>Circumventing or evading economic sanctions, trade restrictions, export controls, or embargoes</li>
              <li>Tax evasion, tax fraud, or other violations of tax laws and obligations</li>
              <li>Transactions with or for the benefit of sanctioned individuals, entities, countries, or regions</li>
              <li>Operating or facilitating illegal gambling, gaming, or lottery operations</li>
              <li>Trafficking in controlled substances, narcotics, pharmaceuticals, weapons, or human beings</li>
              <li>Child exploitation, abuse, or distribution of child sexual abuse material</li>
              <li>Intellectual property infringement, counterfeiting, or piracy</li>
              <li>Cybercrime, hacking, malware distribution, or unauthorized computer access</li>
              <li>Pyramid schemes, Ponzi schemes, multi-level marketing fraud, or investment fraud</li>
              <li>Market manipulation, insider trading, or securities fraud</li>
              <li>Any activity that violates applicable laws, regulations, or these Terms</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              9.2 <strong>Sanctions Compliance:</strong> You represent and warrant that: (a) you are not a person or entity subject to economic sanctions; (b) you are not owned or controlled by sanctioned persons; (c) you will not use our Services for transactions involving sanctioned parties or jurisdictions; (d) you will immediately notify us if your sanctions status changes.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              9.3 <strong>Suspicious Activity Reporting:</strong> We are legally obligated to monitor transactions and report suspicious activities to the Financial Intelligence Analysis Unit (FIAU) and other relevant authorities. You acknowledge that we may report suspicious activities without notifying you and that such reporting does not constitute a breach of confidentiality.
            </p>
            <p className="text-gray-700 leading-relaxed">
              9.4 <strong>Consequences of Violation:</strong> Violation of these prohibitions may result in: (a) immediate Account suspension or closure; (b) blocking or reversal of transactions; (c) reporting to law enforcement and regulatory authorities; (d) cooperation with criminal investigations; (e) civil and criminal liability; (f) permanent exclusion from our Services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">10. DATA PROTECTION AND PRIVACY</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              10.1 <strong>Data Controller:</strong> Malta Global Crypto Bank acts as the data controller for Personal Data collected and processed in connection with your Account and use of Services, in accordance with the General Data Protection Regulation (GDPR) and applicable data protection legislation.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              10.2 <strong>Privacy Policy:</strong> Our collection, use, storage, transfer, and disclosure of your Personal Data are governed by our Privacy Policy, which is available on our website and forms an integral part of these Terms.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              10.3 <strong>Consent to Data Processing:</strong> By registering for an Account, you consent to the collection, processing, and transfer of your Personal Data as described in our Privacy Policy and for the following purposes: (a) Account opening and administration; (b) identity verification and KYC compliance; (c) transaction processing; (d) fraud prevention and security; (e) regulatory compliance and reporting; (f) product and service improvement; (g) marketing communications (where consented); (h) legal claims and dispute resolution.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              10.4 <strong>Data Sharing:</strong> We may share your Personal Data with: (a) group companies and affiliates; (b) regulatory authorities and law enforcement; (c) third-party service providers acting on our behalf; (d) correspondent and beneficiary banks; (e) payment networks and card schemes; (f) credit reference agencies; (g) professional advisors; (h) any party to whom we may transfer our rights and obligations.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              10.5 <strong>International Transfers:</strong> Your Personal Data may be transferred to and processed in countries outside the European Economic Area. Where such transfers occur, we ensure appropriate safeguards are in place in accordance with GDPR requirements.
            </p>
            <p className="text-gray-700 leading-relaxed">
              10.6 <strong>Your Rights:</strong> Subject to applicable law, you have rights regarding your Personal Data, including the right to access, rectification, erasure, restriction, data portability, and objection. To exercise these rights, please contact us using the details provided in our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">11. ACCOUNT SUSPENSION AND TERMINATION</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              11.1 <strong>Suspension Rights:</strong> We may immediately suspend or restrict your access to Services, in whole or in part, without prior notice if:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>We suspect unauthorized access, fraud, or security breach affecting your Account</li>
              <li>We are required to do so by law, court order, or regulatory authority</li>
              <li>We reasonably believe you have violated these Terms</li>
              <li>Your Account shows unusual, suspicious, or potentially harmful activity</li>
              <li>You fail to provide requested documentation within specified timeframes</li>
              <li>Your Account remains inactive for an extended period</li>
              <li>We determine suspension is necessary to protect our interests or those of other customers</li>
              <li>Your insolvency, bankruptcy, or similar proceedings are initiated</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              11.2 <strong>Termination by You:</strong> You may request to close your Account at any time by providing written notice through our official channels. Account closure is subject to: (a) settlement of all outstanding obligations and liabilities; (b) completion or cancellation of pending Transactions; (c) applicable Account closure fees; (d) regulatory retention requirements.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              11.3 <strong>Termination by Us:</strong> We may terminate your Account: (a) immediately and without notice in cases of suspected fraud, money laundering, breach of these Terms, or regulatory requirement; (b) upon thirty (30) days' notice for any other reason at our sole discretion.
            </p>
            <p className="text-gray-700 leading-relaxed">
              11.4 <strong>Effect of Termination:</strong> Upon termination: (a) your access to Services will be revoked; (b) any remaining balance will be transferred to a designated account or made available for withdrawal, subject to applicable fees and legal holds; (c) we may retain your data as required by law; (d) provisions of these Terms that by their nature should survive termination shall continue in effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">12. LIMITATION OF LIABILITY</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              12.1 <strong>No Warranty:</strong> OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              12.2 <strong>Service Availability:</strong> WE DO NOT WARRANT THAT OUR SERVICES WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE, OR THAT ANY DEFECTS WILL BE CORRECTED.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              12.3 <strong>Exclusion of Liability:</strong> TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, MALTA GLOBAL CRYPTO BANK, ITS DIRECTORS, OFFICERS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, REVENUE, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES, REGARDLESS OF WHETHER WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              12.4 <strong>Liability Cap:</strong> IN NO EVENT SHALL OUR TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO THESE TERMS OR YOUR USE OF SERVICES EXCEED THE GREATER OF: (A) THE TOTAL FEES PAID BY YOU IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE CLAIM; OR (B) ONE HUNDRED EUROS (EUR 100).
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              12.5 <strong>Third-Party Actions:</strong> We shall not be liable for any acts, omissions, errors, delays, or failures of third parties, including correspondent banks, payment networks, telecommunications providers, governmental authorities, or force majeure events.
            </p>
            <p className="text-gray-700 leading-relaxed">
              12.6 <strong>Consumer Rights:</strong> Nothing in these Terms shall limit or exclude any liability that cannot be limited or excluded under applicable consumer protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">13. INDEMNIFICATION</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              13.1 You agree to indemnify, defend, and hold harmless Malta Global Crypto Bank, its parent company, subsidiaries, affiliates, directors, officers, employees, agents, contractors, and licensors from and against any and all claims, demands, damages, obligations, losses, liabilities, costs, debt, and expenses (including but not limited to reasonable attorneys' fees and legal costs) arising from or relating to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Your use of or access to the Services</li>
              <li>Your violation of any provision of these Terms</li>
              <li>Your violation of any applicable law, regulation, or third-party rights</li>
              <li>Any misrepresentation made by you</li>
              <li>Any content, data, or information you submit through the Services</li>
              <li>Any negligent, wrongful, or fraudulent act or omission by you</li>
              <li>Any claim that your actions caused damage or harm to a third party</li>
              <li>Your failure to maintain the security of your Account credentials</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">14. DISPUTE RESOLUTION AND GOVERNING LAW</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              14.1 <strong>Complaints Procedure:</strong> If you have a complaint regarding our Services, please contact our Customer Service team in the first instance. We will acknowledge your complaint within five (5) Business Days and endeavor to resolve it within fifteen (15) Business Days. If we cannot resolve within this period, we will inform you of the reasons for delay and expected resolution timeframe.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              14.2 <strong>Regulatory Complaints:</strong> If you are not satisfied with our resolution of your complaint, you may refer the matter to the Malta Financial Services Authority (MFSA) or the Office of the Arbiter for Financial Services in Malta.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              14.3 <strong>Governing Law:</strong> These Terms shall be governed by and construed in accordance with the laws of Malta and applicable European Union regulations, without regard to conflict of law principles.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              14.4 <strong>Jurisdiction:</strong> Subject to mandatory consumer protection provisions, any disputes arising from or relating to these Terms or your use of Services shall be subject to the exclusive jurisdiction of the courts of Malta.
            </p>
            <p className="text-gray-700 leading-relaxed">
              14.5 <strong>Class Action Waiver:</strong> TO THE MAXIMUM EXTENT PERMITTED BY LAW, YOU AGREE TO RESOLVE DISPUTES WITH US ON AN INDIVIDUAL BASIS ONLY AND WAIVE ANY RIGHT TO BRING OR PARTICIPATE IN A CLASS ACTION, CLASS-WIDE ARBITRATION, COLLECTIVE ACTION, OR ANY OTHER REPRESENTATIVE PROCEEDING.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">15. DEPOSIT PROTECTION</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              15.1 <strong>Depositor Compensation Scheme:</strong> Malta Global Crypto Bank is a participant in the Depositor Compensation Scheme established under Maltese law. Eligible deposits are protected up to EUR 100,000 per depositor per credit institution.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              15.2 <strong>Coverage:</strong> The scheme covers deposits in all currencies held by natural persons and legal entities, subject to certain exclusions as prescribed by law. Deposits held for temporary high balances may qualify for additional protection up to EUR 500,000 for a period of up to twelve (12) months.
            </p>
            <p className="text-gray-700 leading-relaxed">
              15.3 <strong>Cryptocurrency Holdings:</strong> Please note that cryptocurrency and digital asset holdings may not be covered by the Depositor Compensation Scheme. The protection status of such holdings depends on the nature of the custody arrangement and applicable regulations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">16. REGULATORY INFORMATION AND LICENSING</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              16.1 <strong>Authorisation:</strong> Malta Global Crypto Bank is a credit institution authorised and regulated by the Malta Financial Services Authority (MFSA) under the Banking Act (Cap. 371 of the Laws of Malta). The Bank is also authorised to provide virtual financial asset services under the Virtual Financial Assets Act (Cap. 590 of the Laws of Malta).
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              16.2 <strong>License Details:</strong> License Number: C-12345 (Banking); VFA License Number: VFA/2024/001. These licenses can be verified on the MFSA official website.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              16.3 <strong>Regulatory Contact:</strong> For regulatory complaints or inquiries, you may contact the MFSA directly at:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-gray-700 mb-4">
              <p><strong>Malta Financial Services Authority</strong></p>
              <p>Triq l-Imdina, Zone 1</p>
              <p>Central Business District, Birkirkara CBD 1010</p>
              <p>Malta</p>
              <p className="mt-2">Website: www.mfsa.mt</p>
              <p>Telephone: +356 2144 1155</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">17. MISCELLANEOUS PROVISIONS</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              17.1 <strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy, Fee Schedule, and any other policies referenced herein, constitute the entire agreement between you and Malta Global Crypto Bank regarding the subject matter hereof and supersede all prior agreements, representations, and understandings.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              17.2 <strong>Severability:</strong> If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision shall be modified to the minimum extent necessary to make it valid and enforceable, and the remaining provisions shall continue in full force and effect.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              17.3 <strong>No Waiver:</strong> Our failure or delay in exercising any right, power, or remedy under these Terms shall not constitute a waiver of such right, power, or remedy. Any waiver must be in writing and signed by an authorized representative of the Bank.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              17.4 <strong>Assignment:</strong> You may not assign, transfer, or delegate any of your rights or obligations under these Terms without our prior written consent. We may freely assign or transfer our rights and obligations under these Terms to any affiliate or successor.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              17.5 <strong>No Third-Party Beneficiaries:</strong> These Terms do not create any third-party beneficiary rights except as expressly provided herein.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              17.6 <strong>Notices:</strong> All notices to the Bank must be sent in writing to our registered address or through our official digital channels. We may provide notices to you through your registered email address, in-app notifications, or our banking platform.
            </p>
            <p className="text-gray-700 leading-relaxed">
              17.7 <strong>Language:</strong> These Terms are drafted in English. If translated into any other language, the English version shall prevail in case of any inconsistency.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">18. CONTACT INFORMATION</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions, concerns, or require assistance regarding these Terms, your Account, or our Services, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg text-gray-700">
              <p className="text-lg font-bold text-gray-900 mb-3">Malta Global Crypto Bank</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold mb-2">Registered Office:</p>
                  <p>171 Old Bakery Street</p>
                  <p>VLT 1455 Valletta</p>
                  <p>Malta</p>
                </div>
                <div>
                  <p className="font-semibold mb-2">Contact Details:</p>
                  <p>Email: support@mgcb.mt</p>
                  <p>Legal Inquiries: legal@mgcb.mt</p>
                  <p>Telephone: +356 2122 0000</p>
                </div>
              </div>
            </div>
          </section>

          <div className="border-t-2 border-[#b91c1c] pt-8 mt-8">
            <div className="bg-red-50 border border-red-200 p-6 text-center">
              <p className="text-gray-700 font-medium mb-3">
                By clicking "Create Account" or checking the acceptance box, you acknowledge that you have read, understood, and agree to be legally bound by these Terms and Conditions in their entirety.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Copyright 2026 Malta Global Crypto Bank. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
