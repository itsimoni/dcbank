"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
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
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-red-100 mt-2">Last Updated: February 20, 2026</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-8">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. INTRODUCTION AND SCOPE</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Valore Digital Banking Services Limited ("Valore", "Company", "we", "us", or "our") is committed to protecting the privacy and security of your personal information. This Privacy Policy ("Policy") describes how we collect, use, disclose, store, and protect your personal data when you use our digital banking platform, mobile applications, websites, and related services (collectively, the "Services").
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              This Policy applies to all individuals who access or use our Services, including customers, prospective customers, website visitors, and any other persons whose personal data we may process in connection with our business operations.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              We process your personal data in accordance with applicable data protection laws and regulations, including but not limited to the Swiss Federal Act on Data Protection (FADP), the European Union General Data Protection Regulation (GDPR), and other relevant privacy legislation in jurisdictions where we operate.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By using our Services, you acknowledge that you have read and understood this Privacy Policy. If you do not agree with our data practices as described herein, please discontinue use of our Services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. DATA CONTROLLER INFORMATION</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For the purposes of applicable data protection laws, Valore Digital Banking Services Limited is the data controller responsible for your personal data. Our contact details are:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-gray-700 mb-4">
              <p><strong>Valore Digital Banking Services Limited</strong></p>
              <p>Bahnhofstrasse 42</p>
              <p>8001 Zurich, Switzerland</p>
              <p className="mt-2">Data Protection Officer: privacy@valore-bank.com</p>
              <p>General Inquiries: support@valore-bank.com</p>
              <p>Phone: +41 44 000 0000</p>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Our Data Protection Officer is responsible for overseeing compliance with this Privacy Policy and applicable data protection laws. If you have any questions about this Policy or our data practices, please contact our Data Protection Officer using the contact details provided above.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">3. CATEGORIES OF PERSONAL DATA WE COLLECT</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We collect various categories of personal data depending on your relationship with us and the Services you use. The types of personal data we may collect include:
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.1 Identity Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Full legal name, including first name, middle name(s), and surname</li>
              <li>Previous names (maiden name, name changes)</li>
              <li>Date of birth and place of birth</li>
              <li>Gender</li>
              <li>Nationality and citizenship status</li>
              <li>Government-issued identification numbers (passport number, national ID number, driver's license number)</li>
              <li>Tax identification number(s)</li>
              <li>Photographs and biometric data (facial recognition data, fingerprints where applicable)</li>
              <li>Signature</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.2 Contact Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Residential address (current and previous)</li>
              <li>Mailing address (if different from residential)</li>
              <li>Email address(es)</li>
              <li>Telephone number(s) (mobile, home, work)</li>
              <li>Emergency contact details</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.3 Financial Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Bank account numbers and details</li>
              <li>Transaction history and records</li>
              <li>Account balances and statements</li>
              <li>Payment card details</li>
              <li>Income and employment information</li>
              <li>Source of funds and wealth</li>
              <li>Investment portfolio information</li>
              <li>Credit history and credit scores</li>
              <li>Tax-related information</li>
              <li>Beneficiary and payee information</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.4 Technical and Device Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>IP address</li>
              <li>Device identifiers (IMEI, UDID, device ID)</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Time zone settings</li>
              <li>Language preferences</li>
              <li>Screen resolution</li>
              <li>Mobile network information</li>
              <li>Cookie data and similar tracking technologies</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.5 Usage and Behavioral Data</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Login timestamps and session duration</li>
              <li>Pages visited and features used</li>
              <li>Click patterns and navigation paths</li>
              <li>Transaction patterns and preferences</li>
              <li>Communication preferences</li>
              <li>Customer service interactions</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.6 Location Data</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>GPS coordinates (with your consent)</li>
              <li>Location inferred from IP address</li>
              <li>Transaction location data</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.7 Special Categories of Data</h3>
            <p className="text-gray-700 leading-relaxed">
              In limited circumstances, we may process special categories of personal data (sensitive data) such as health information (for insurance products) or political exposure status (for regulatory compliance). We will only process such data with your explicit consent or where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">4. HOW WE COLLECT YOUR DATA</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We collect personal data through various means:
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4.1 Direct Collection</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Account registration and application forms</li>
              <li>Identity verification processes (KYC)</li>
              <li>Customer service communications (calls, emails, chat)</li>
              <li>Surveys and feedback forms</li>
              <li>Marketing sign-ups and preferences</li>
              <li>In-person meetings and branch visits</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4.2 Automated Collection</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Cookies and similar tracking technologies</li>
              <li>Server logs and analytics tools</li>
              <li>Mobile device sensors and identifiers</li>
              <li>Fraud detection systems</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4.3 Third-Party Sources</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Credit reference agencies</li>
              <li>Identity verification service providers</li>
              <li>Fraud prevention databases</li>
              <li>Government agencies and public registers</li>
              <li>Business partners and affiliates</li>
              <li>Correspondent banks and financial institutions</li>
              <li>Social media platforms (where you have linked accounts)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">5. PURPOSES AND LEGAL BASES FOR PROCESSING</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We process your personal data for the following purposes and legal bases:
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">5.1 Contract Performance</h3>
            <p className="text-gray-700 leading-relaxed mb-2">
              Processing necessary to fulfill our contractual obligations to you:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Opening and managing your account</li>
              <li>Processing transactions and payments</li>
              <li>Providing customer support</li>
              <li>Sending account-related communications</li>
              <li>Delivering requested products and services</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">5.2 Legal Obligations</h3>
            <p className="text-gray-700 leading-relaxed mb-2">
              Processing necessary to comply with legal and regulatory requirements:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Anti-money laundering (AML) and counter-terrorism financing (CTF) compliance</li>
              <li>Know Your Customer (KYC) verification</li>
              <li>Sanctions screening and compliance</li>
              <li>Tax reporting obligations (FATCA, CRS)</li>
              <li>Regulatory reporting to financial authorities</li>
              <li>Responding to legal requests and court orders</li>
              <li>Maintaining records as required by law</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">5.3 Legitimate Interests</h3>
            <p className="text-gray-700 leading-relaxed mb-2">
              Processing necessary for our legitimate business interests (balanced against your rights):
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Fraud prevention and detection</li>
              <li>Security monitoring and incident response</li>
              <li>Risk management and credit assessment</li>
              <li>Service improvement and development</li>
              <li>Analytics and business intelligence</li>
              <li>Debt collection and recovery</li>
              <li>Internal auditing and compliance monitoring</li>
              <li>Defending legal claims</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">5.4 Consent</h3>
            <p className="text-gray-700 leading-relaxed mb-2">
              Processing based on your explicit consent:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Marketing communications and promotional offers</li>
              <li>Personalized advertising and product recommendations</li>
              <li>Location-based services</li>
              <li>Biometric authentication features</li>
              <li>Sharing data with selected third parties for marketing purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">6. DATA SHARING AND DISCLOSURE</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may share your personal data with the following categories of recipients:
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6.1 Group Companies</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may share your data with our parent company, subsidiaries, and affiliates for internal administrative purposes, service delivery, and compliance with group-wide policies.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6.2 Service Providers</h3>
            <p className="text-gray-700 leading-relaxed mb-2">
              We engage trusted third-party service providers who process data on our behalf:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Cloud hosting and infrastructure providers</li>
              <li>Payment processing partners</li>
              <li>Identity verification services</li>
              <li>Fraud detection and prevention services</li>
              <li>Customer support platforms</li>
              <li>Marketing and analytics providers</li>
              <li>Document storage and archiving services</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6.3 Financial Partners</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Correspondent banks and financial institutions</li>
              <li>Payment networks (SWIFT, SEPA, card networks)</li>
              <li>Credit reference agencies</li>
              <li>Insurance providers</li>
              <li>Investment partners</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6.4 Regulatory and Legal Authorities</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Financial regulatory authorities (FINMA, etc.)</li>
              <li>Tax authorities (domestic and international)</li>
              <li>Law enforcement agencies</li>
              <li>Courts and judicial bodies</li>
              <li>Anti-money laundering authorities</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6.5 Professional Advisors</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may share data with our legal advisors, auditors, accountants, and consultants for professional advice and compliance purposes, subject to confidentiality obligations.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6.6 Business Transfers</h3>
            <p className="text-gray-700 leading-relaxed">
              In the event of a merger, acquisition, reorganization, or sale of assets, your personal data may be transferred as part of the business transaction. We will notify you of any such transfer and any changes to this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">7. INTERNATIONAL DATA TRANSFERS</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your personal data may be transferred to and processed in countries outside your country of residence, including countries that may not provide the same level of data protection as your home jurisdiction.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              When we transfer personal data internationally, we implement appropriate safeguards to protect your data:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Adequacy Decisions:</strong> Transfers to countries recognized as providing adequate data protection (e.g., European Commission adequacy decisions)</li>
              <li><strong>Standard Contractual Clauses:</strong> We use EU-approved standard contractual clauses with recipients in countries without adequacy decisions</li>
              <li><strong>Binding Corporate Rules:</strong> Transfers within our corporate group are governed by approved binding corporate rules</li>
              <li><strong>Certification Schemes:</strong> We work with partners certified under recognized frameworks</li>
              <li><strong>Consent:</strong> In certain cases, transfers may be based on your explicit consent</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              You may request information about the safeguards we use for international transfers by contacting our Data Protection Officer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">8. DATA RETENTION</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected, comply with legal obligations, and exercise or defend legal claims. Retention periods vary depending on the type of data and applicable requirements:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Account Information:</strong> Duration of customer relationship plus 10 years after account closure (regulatory requirement)</li>
              <li><strong>Transaction Records:</strong> 10 years from the date of the transaction (anti-money laundering requirements)</li>
              <li><strong>KYC Documentation:</strong> 10 years after the end of the customer relationship</li>
              <li><strong>Communication Records:</strong> 5-7 years depending on the type of communication</li>
              <li><strong>Marketing Preferences:</strong> Until you withdraw consent or 3 years of inactivity</li>
              <li><strong>Website Analytics:</strong> 26 months (standard analytics retention)</li>
              <li><strong>CCTV and Security Footage:</strong> 90 days unless required for investigation</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              After the retention period expires, we securely delete or anonymize your personal data. Anonymized data may be retained indefinitely for statistical and analytical purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">9. YOUR DATA PROTECTION RIGHTS</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Under applicable data protection laws, you have the following rights regarding your personal data:
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">9.1 Right of Access</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the right to request confirmation of whether we process your personal data and, if so, to obtain a copy of that data along with information about how we process it.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">9.2 Right to Rectification</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the right to request correction of inaccurate personal data and completion of incomplete data.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">9.3 Right to Erasure ("Right to be Forgotten")</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the right to request deletion of your personal data in certain circumstances, such as when the data is no longer necessary for the purposes for which it was collected. This right is subject to legal retention requirements.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">9.4 Right to Restriction of Processing</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the right to request that we limit how we use your personal data in certain circumstances, such as while we verify the accuracy of contested data.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">9.5 Right to Data Portability</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the right to receive your personal data in a structured, commonly used, machine-readable format and to transmit that data to another controller.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">9.6 Right to Object</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the right to object to processing based on legitimate interests or for direct marketing purposes. We will stop processing unless we demonstrate compelling legitimate grounds.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">9.7 Right to Withdraw Consent</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Where processing is based on consent, you have the right to withdraw that consent at any time. Withdrawal does not affect the lawfulness of processing prior to withdrawal.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">9.8 Rights Related to Automated Decision-Making</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the right not to be subject to decisions based solely on automated processing that produce legal or significant effects, and to obtain human intervention in such decisions.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Exercising Your Rights</h3>
            <p className="text-gray-700 leading-relaxed">
              To exercise any of these rights, please contact our Data Protection Officer at privacy@valore-bank.com. We will respond to your request within 30 days. We may request verification of your identity before processing your request. In certain circumstances, we may be unable to comply with your request due to legal obligations or other legitimate grounds.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">10. COOKIES AND TRACKING TECHNOLOGIES</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and deliver personalized content.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">10.1 Types of Cookies We Use</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Essential Cookies:</strong> Required for core functionality, security, and authentication. Cannot be disabled.</li>
              <li><strong>Performance Cookies:</strong> Collect anonymous usage statistics to improve our services.</li>
              <li><strong>Functional Cookies:</strong> Remember your preferences and settings.</li>
              <li><strong>Targeting/Advertising Cookies:</strong> Used to deliver relevant advertisements (with consent).</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">10.2 Managing Cookies</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You can manage cookie preferences through our cookie consent banner or your browser settings. Note that disabling certain cookies may affect the functionality of our Services.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">10.3 Other Tracking Technologies</h3>
            <p className="text-gray-700 leading-relaxed">
              We may also use web beacons, pixels, local storage, and similar technologies. The principles described above apply equally to these technologies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">11. DATA SECURITY</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We implement comprehensive technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Encryption:</strong> All data in transit is encrypted using TLS 1.3. Sensitive data at rest is encrypted using AES-256.</li>
              <li><strong>Access Controls:</strong> Strict role-based access controls limit data access to authorized personnel only.</li>
              <li><strong>Authentication:</strong> Multi-factor authentication is implemented for sensitive operations.</li>
              <li><strong>Monitoring:</strong> 24/7 security monitoring and intrusion detection systems.</li>
              <li><strong>Penetration Testing:</strong> Regular security assessments and penetration testing by independent experts.</li>
              <li><strong>Employee Training:</strong> Mandatory security and privacy training for all employees.</li>
              <li><strong>Incident Response:</strong> Documented incident response procedures and business continuity plans.</li>
              <li><strong>Physical Security:</strong> Data centers feature 24/7 security, biometric access, and environmental controls.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              While we take all reasonable precautions, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security of your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">12. DATA BREACH NOTIFICATION</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              In the event of a personal data breach that is likely to result in a risk to your rights and freedoms, we will:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Notify the relevant supervisory authority within 72 hours of becoming aware of the breach</li>
              <li>Notify affected individuals without undue delay if the breach is likely to result in high risk</li>
              <li>Document all breaches, including facts, effects, and remedial actions taken</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              We maintain comprehensive breach response procedures and regularly test our incident response capabilities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">13. CHILDREN'S PRIVACY</h2>
            <p className="text-gray-700 leading-relaxed">
              Our Services are not intended for individuals under the age of 18 (or the age of majority in their jurisdiction). We do not knowingly collect personal data from children. If we become aware that we have collected personal data from a child without appropriate consent, we will take steps to delete that information promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">14. THIRD-PARTY LINKS AND SERVICES</h2>
            <p className="text-gray-700 leading-relaxed">
              Our Services may contain links to third-party websites, applications, or services that are not operated by us. We are not responsible for the privacy practices of these third parties. We encourage you to review the privacy policies of any third-party sites you visit. This Privacy Policy applies only to our Services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">15. AUTOMATED DECISION-MAKING AND PROFILING</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may use automated decision-making and profiling in certain circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Fraud Detection:</strong> Automated systems analyze transactions for suspicious patterns</li>
              <li><strong>Credit Decisions:</strong> Automated assessment of creditworthiness based on defined criteria</li>
              <li><strong>Risk Scoring:</strong> Customer risk categorization for compliance purposes</li>
              <li><strong>Personalization:</strong> Tailoring product recommendations based on your profile</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              You have the right to request human review of automated decisions that significantly affect you. Contact our Data Protection Officer to exercise this right.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">16. CHANGES TO THIS PRIVACY POLICY</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make material changes, we will:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Post the updated Policy on our platform with a new "Last Updated" date</li>
              <li>Notify you through prominent notice on our Services or by email</li>
              <li>Where required by law, seek your consent to material changes</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              We encourage you to review this Policy periodically. Your continued use of our Services after changes are posted constitutes your acceptance of the updated Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">17. COMPLAINTS AND REGULATORY CONTACTS</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you are not satisfied with how we handle your personal data or respond to your requests, you have the right to lodge a complaint with a supervisory authority:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-gray-700 mb-4">
              <p><strong>Swiss Federal Data Protection and Information Commissioner (FDPIC)</strong></p>
              <p>Feldeggweg 1</p>
              <p>CH-3003 Bern, Switzerland</p>
              <p>Website: www.edoeb.admin.ch</p>
            </div>
            <p className="text-gray-700 leading-relaxed">
              If you are located in the European Economic Area, you may also contact your local data protection authority.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">18. CONTACT US</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions, comments, or concerns about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-gray-700">
              <p><strong>Data Protection Officer</strong></p>
              <p>Valore Digital Banking Services Limited</p>
              <p>Bahnhofstrasse 42</p>
              <p>8001 Zurich, Switzerland</p>
              <p className="mt-2">Email: privacy@valore-bank.com</p>
              <p>Phone: +41 44 000 0000</p>
              <p className="mt-2">Response Time: We aim to respond to all inquiries within 5 business days.</p>
            </div>
          </section>

          <div className="border-t border-gray-200 pt-8 mt-8">
            <p className="text-sm text-gray-500 text-center">
              This Privacy Policy is provided in English. In case of any discrepancy between translated versions and the English version, the English version shall prevail.
            </p>
            <p className="text-sm text-gray-500 text-center mt-2">
              Document Version: 3.2.0 | Effective Date: February 20, 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
