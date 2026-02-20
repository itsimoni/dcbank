export default function CryptoTermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Cryptocurrency Payment Terms and Conditions
          </h1>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <div className="bg-gray-50 p-6 border-l-4 border-[#b91c1c]">
              <p className="font-semibold text-gray-900 text-lg">IMPORTANT LEGAL NOTICE</p>
              <p className="mt-3">
                These Terms and Conditions ("Agreement") constitute a legally binding contract between you ("User", "Customer", or "you") and Digital Chain Financial Services ("Company", "we", "us", or "our") regarding the use of cryptocurrency payment services. By proceeding with any cryptocurrency transaction, you acknowledge that you have read, understood, and agree to be bound by all terms contained herein.
              </p>
            </div>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">1. DEFINITIONS AND INTERPRETATION</h2>
              <p className="mb-3">1.1. "Cryptocurrency" or "Digital Asset" refers to any blockchain-based digital currency, including but not limited to Bitcoin (BTC), Ethereum (ETH), Tether (USDT), and any other virtual currencies supported by our platform.</p>
              <p className="mb-3">1.2. "Transaction" means any transfer, exchange, deposit, withdrawal, or conversion of cryptocurrency conducted through our services.</p>
              <p className="mb-3">1.3. "Wallet Address" refers to a unique alphanumeric identifier used to send and receive cryptocurrency on a blockchain network.</p>
              <p className="mb-3">1.4. "Blockchain" means a distributed ledger technology that records transactions across multiple computers in a manner that cannot be altered retroactively.</p>
              <p className="mb-3">1.5. "Smart Contract" refers to self-executing code deployed on a blockchain network that automatically enforces the terms of an agreement.</p>
              <p>1.6. "Private Key" means the cryptographic key that provides access and control over cryptocurrency stored at a specific wallet address.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">2. ELIGIBILITY AND USER REPRESENTATIONS</h2>
              <p className="mb-3">2.1. By using our cryptocurrency payment services, you represent and warrant that:</p>
              <ul className="list-disc pl-8 space-y-2 mb-4">
                <li>You are at least eighteen (18) years of age or the legal age of majority in your jurisdiction, whichever is higher;</li>
                <li>You have the legal capacity to enter into binding agreements;</li>
                <li>You are not located in, or a citizen or resident of, any jurisdiction where cryptocurrency transactions are prohibited or restricted;</li>
                <li>You are not subject to any sanctions administered by the United States Office of Foreign Assets Control (OFAC), the European Union, the United Nations, or any other applicable governmental authority;</li>
                <li>The funds used for cryptocurrency transactions are not derived from illegal activities, money laundering, terrorist financing, or any other unlawful sources;</li>
                <li>You will not use our services for any illegal, fraudulent, or unauthorized purposes.</li>
              </ul>
              <p>2.2. You acknowledge that failure to comply with any of these representations may result in immediate termination of services and potential legal action.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">3. NATURE OF CRYPTOCURRENCY TRANSACTIONS</h2>
              <p className="mb-3">3.1. <strong>Irreversibility:</strong> You expressly acknowledge and understand that cryptocurrency transactions are irreversible once confirmed on the blockchain. Unlike traditional banking systems, there is no central authority capable of reversing, canceling, or modifying a completed transaction. Once you initiate a cryptocurrency transfer, the transaction cannot be undone, and the Company bears no responsibility for any errors in wallet addresses, amounts, or network selection.</p>
              <p className="mb-3">3.2. <strong>Finality:</strong> All cryptocurrency transactions are final upon blockchain confirmation. The Company cannot recover funds sent to incorrect addresses, unsupported networks, or lost due to user error.</p>
              <p className="mb-3">3.3. <strong>Network Fees:</strong> Cryptocurrency transactions require network fees (commonly known as "gas fees" for Ethereum-based transactions or "miner fees" for Bitcoin). These fees are paid to blockchain network validators and are non-refundable, regardless of transaction outcome.</p>
              <p>3.4. <strong>Confirmation Times:</strong> Transaction confirmation times vary depending on network congestion, fee levels, and blockchain-specific parameters. The Company does not guarantee specific confirmation times and is not liable for delays caused by network conditions.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">4. RISK DISCLOSURE AND ACKNOWLEDGMENT</h2>
              <p className="mb-3">4.1. <strong>Market Volatility:</strong> Cryptocurrency markets are highly volatile. The value of digital assets can fluctuate significantly within short periods. You acknowledge that you may experience substantial losses and that past performance is not indicative of future results.</p>
              <p className="mb-3">4.2. <strong>Regulatory Risk:</strong> The regulatory status of cryptocurrencies varies by jurisdiction and is subject to change. New laws or regulations may adversely affect the use, transfer, or value of cryptocurrencies. You are solely responsible for compliance with applicable laws in your jurisdiction.</p>
              <p className="mb-3">4.3. <strong>Technology Risk:</strong> Blockchain technology is subject to technological risks including, but not limited to, software bugs, network attacks, protocol changes, hard forks, and potential obsolescence. The Company does not guarantee the continuous operation or security of any blockchain network.</p>
              <p className="mb-3">4.4. <strong>Security Risk:</strong> Despite implementing industry-standard security measures, no system is completely secure. You acknowledge the risk of unauthorized access, hacking, theft, and loss of digital assets.</p>
              <p className="mb-3">4.5. <strong>Counterparty Risk:</strong> Transactions with third parties carry inherent risks. The Company is not responsible for the actions, omissions, or failures of any third party.</p>
              <p>4.6. <strong>Tax Implications:</strong> Cryptocurrency transactions may have tax implications in your jurisdiction. You are solely responsible for determining and fulfilling any tax obligations arising from your cryptocurrency activities.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">5. USER RESPONSIBILITIES</h2>
              <p className="mb-3">5.1. <strong>Accuracy of Information:</strong> You are solely responsible for ensuring the accuracy of all information provided, including but not limited to wallet addresses, transaction amounts, and network selection. The Company shall not be liable for any losses resulting from incorrect information.</p>
              <p className="mb-3">5.2. <strong>Security:</strong> You are responsible for maintaining the security of your account credentials, private keys, and any devices used to access our services. You agree to immediately notify the Company of any unauthorized access or security breaches.</p>
              <p className="mb-3">5.3. <strong>Compliance:</strong> You agree to comply with all applicable laws, regulations, and these Terms and Conditions when using our services.</p>
              <p>5.4. <strong>Due Diligence:</strong> You acknowledge that you have conducted your own due diligence regarding the risks associated with cryptocurrency transactions and have not relied solely on information provided by the Company.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">6. ANTI-MONEY LAUNDERING (AML) AND KNOW YOUR CUSTOMER (KYC)</h2>
              <p className="mb-3">6.1. The Company is committed to preventing money laundering, terrorist financing, and other financial crimes. By using our services, you agree to comply with our AML and KYC policies.</p>
              <p className="mb-3">6.2. You may be required to provide identity verification documents, proof of address, source of funds documentation, and other information as requested by the Company.</p>
              <p className="mb-3">6.3. The Company reserves the right to refuse, suspend, or terminate services to any user who fails to meet our KYC requirements or whose activities raise suspicion of illegal conduct.</p>
              <p>6.4. The Company may report suspicious activities to relevant authorities as required by law, without prior notice to the user.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">7. LIMITATION OF LIABILITY</h2>
              <p className="mb-3">7.1. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE COMPANY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, REGARDLESS OF WHETHER SUCH DAMAGES WERE FORESEEABLE OR WHETHER THE COMPANY WAS ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
              <p className="mb-3">7.2. The Company's total liability for any claims arising out of or related to these Terms shall not exceed the lesser of: (a) the amount of fees paid by you to the Company in the twelve (12) months preceding the claim, or (b) one hundred euros (EUR 100).</p>
              <p className="mb-3">7.3. The Company shall not be liable for any losses arising from:</p>
              <ul className="list-disc pl-8 space-y-2 mb-4">
                <li>User error in providing wallet addresses or transaction details;</li>
                <li>Blockchain network failures, delays, or congestion;</li>
                <li>Unauthorized access resulting from user negligence;</li>
                <li>Market volatility or cryptocurrency value fluctuations;</li>
                <li>Actions or omissions of third parties;</li>
                <li>Force majeure events.</li>
              </ul>
              <p>7.4. Some jurisdictions do not allow the exclusion or limitation of certain damages. In such jurisdictions, the Company's liability shall be limited to the maximum extent permitted by law.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">8. INDEMNIFICATION</h2>
              <p>8.1. You agree to indemnify, defend, and hold harmless the Company, its affiliates, officers, directors, employees, agents, and successors from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to: (a) your use of our services; (b) your violation of these Terms; (c) your violation of any applicable laws or regulations; (d) your infringement of any third-party rights; or (e) any content or information you provide through our services.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">9. INTELLECTUAL PROPERTY</h2>
              <p className="mb-3">9.1. All intellectual property rights in our services, including but not limited to software, trademarks, logos, and content, are owned by or licensed to the Company.</p>
              <p>9.2. These Terms do not grant you any rights to use the Company's intellectual property except as expressly permitted for the use of our services.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">10. PRIVACY AND DATA PROTECTION</h2>
              <p className="mb-3">10.1. The collection, use, and protection of your personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.</p>
              <p>10.2. By using our services, you consent to the collection, processing, and transfer of your personal information as described in our Privacy Policy.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">11. MODIFICATIONS TO TERMS</h2>
              <p className="mb-3">11.1. The Company reserves the right to modify these Terms at any time. Material changes will be communicated through our platform or via email.</p>
              <p>11.2. Your continued use of our services after any modifications constitutes acceptance of the updated Terms.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">12. TERMINATION</h2>
              <p className="mb-3">12.1. The Company may suspend or terminate your access to our services at any time, with or without cause, and with or without notice.</p>
              <p>12.2. Upon termination, all provisions of these Terms that by their nature should survive termination shall survive, including but not limited to ownership provisions, warranty disclaimers, indemnification, and limitations of liability.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">13. DISPUTE RESOLUTION</h2>
              <p className="mb-3">13.1. Any disputes arising out of or relating to these Terms shall first be attempted to be resolved through good-faith negotiation between the parties.</p>
              <p className="mb-3">13.2. If negotiation fails, disputes shall be resolved through binding arbitration in accordance with the rules of the relevant arbitration institution in the Company's jurisdiction.</p>
              <p>13.3. You agree to waive any right to participate in class action lawsuits or class-wide arbitration against the Company.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">14. GOVERNING LAW AND JURISDICTION</h2>
              <p className="mb-3">14.1. These Terms shall be governed by and construed in accordance with the laws of the European Union and the jurisdiction in which the Company is registered, without regard to conflict of law principles.</p>
              <p>14.2. You consent to the exclusive jurisdiction of the courts in the Company's registered jurisdiction for any legal proceedings arising out of these Terms.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">15. SEVERABILITY</h2>
              <p>15.1. If any provision of these Terms is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable while preserving its original intent.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">16. ENTIRE AGREEMENT</h2>
              <p>16.1. These Terms, together with our Privacy Policy and any other policies incorporated by reference, constitute the entire agreement between you and the Company regarding the use of our cryptocurrency payment services and supersede all prior agreements, understandings, and communications.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">17. WAIVER</h2>
              <p>17.1. The failure of the Company to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision. Any waiver must be in writing and signed by an authorized representative of the Company.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">18. CONTACT INFORMATION</h2>
              <p className="mb-2">For questions, concerns, or complaints regarding these Terms or our cryptocurrency payment services, please contact our legal department at:</p>
              <p className="mb-1">Digital Chain Financial Services</p>
              <p className="mb-1">Legal and Compliance Department</p>
              <p>Email: legal@digitalchain.com</p>
            </section>

            <div className="bg-gray-50 p-6 border border-gray-200 mt-8">
              <p className="font-semibold text-gray-900 text-lg mb-3">ACKNOWLEDGMENT OF TERMS</p>
              <p>By checking the acceptance box and proceeding with your cryptocurrency transaction, you confirm that you have read, understood, and agree to be legally bound by all of the terms and conditions set forth in this Agreement. You further acknowledge that you are entering into this Agreement voluntarily and with full knowledge of the risks involved in cryptocurrency transactions.</p>
            </div>

            <p className="text-sm text-gray-500 mt-6">
              Last Updated: February 2026 | Version 3.1.0 | Document Reference: CRYPTO-TC-2026-V3
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
