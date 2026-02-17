import type React from "react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Upload,
  CheckCircle,
  X,
  Clock,
  XCircle,
  ShieldCheck,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Language, getTranslations } from "@/lib/translations";
import { useLanguage } from "@/contexts/LanguageContext";

interface KYCVerificationProps {
  userId: string;
  onKYCComplete: () => void;
}

interface UploadedFile {
  file: File;
  preview: string;
  uploaded: boolean;
}

type KYCStatus = "not_started" | "pending" | "approved" | "rejected";

const languageNames: Record<Language, string> = {
  en: "English",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  el: "Ελληνικά",
};

export default function KYCVerification({
  userId,
  onKYCComplete,
}: KYCVerificationProps) {
  const { language, setLanguage } = useLanguage();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<KYCStatus>("not_started");

  const [documents, setDocuments] = useState({
    idDocument: null as UploadedFile | null,
    driverLicense: null as UploadedFile | null,
    utilityBill: null as UploadedFile | null,
    selfie: null as UploadedFile | null,
  });

  const [formData, setFormData] = useState({
    documentType: "passport",
    documentNumber: "",
    fullName: "",
    dateOfBirth: "",
    address: "",
    city: "",
    country: "",
    postalCode: "",
  });

  const t = getTranslations(language);

  useEffect(() => {
    checkKYCStatus();
  }, [userId]);

  const checkKYCStatus = async () => {
    try {
      setCheckingStatus(true);
      const { data, error } = await supabase
        .from("users")
        .select("kyc_status")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error checking KYC status:", error);
        setKycStatus("not_started");
        return;
      }

      if (data) {
        setKycStatus(data.kyc_status as KYCStatus);

        if (data.kyc_status === "approved") {
          onKYCComplete();
        }
      } else {
        setKycStatus("not_started");
      }
    } catch (error) {
      console.error("Error in checkKYCStatus:", error);
      setKycStatus("not_started");
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleFileUpload = (type: keyof typeof documents, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError(t.fileSizeError);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError(t.fileTypeError);
      return;
    }

    const preview = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : "/pdf-icon.png";

    setDocuments((prev) => ({
      ...prev,
      [type]: {
        file,
        preview,
        uploaded: false,
      },
    }));
    setError(null);
  };

  const uploadFileToSupabase = async (file: File, path: string) => {
    try {
      console.log(`Uploading file to path: ${path}`);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      console.log(`Full file path: ${filePath}`);

      const { data, error } = await supabase.storage
        .from("kyc-documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Storage upload error:", error);
        throw new Error(`File upload failed: ${error.message}`);
      }

      console.log("File uploaded successfully:", data);
      return filePath;
    } catch (error) {
      console.error("Error in uploadFileToSupabase:", error);
      throw error;
    }
  };

  const handleSubmitKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("Starting KYC submission...");

      if (
        !documents.idDocument ||
        !documents.utilityBill ||
        !documents.selfie
      ) {
        throw new Error(t.requiredDocumentsError);
      }

      console.log("Required documents validated");

      console.log("Starting file uploads...");
      const uploadPromises = [];
      const documentPaths: any = {};

      if (documents.idDocument) {
        console.log("Uploading ID document...");
        uploadPromises.push(
          uploadFileToSupabase(
            documents.idDocument.file,
            `${userId}/id-documents`
          ).then((path) => {
            documentPaths.id_document_path = path;
            console.log("ID document uploaded:", path);
          })
        );
      }

      if (documents.driverLicense) {
        console.log("Uploading driver license...");
        uploadPromises.push(
          uploadFileToSupabase(
            documents.driverLicense.file,
            `${userId}/driver-license`
          ).then((path) => {
            documentPaths.driver_license_path = path;
            console.log("Driver license uploaded:", path);
          })
        );
      }

      if (documents.utilityBill) {
        console.log("Uploading utility bill...");
        uploadPromises.push(
          uploadFileToSupabase(
            documents.utilityBill.file,
            `${userId}/utility-bills`
          ).then((path) => {
            documentPaths.utility_bill_path = path;
            console.log("Utility bill uploaded:", path);
          })
        );
      }

      if (documents.selfie) {
        console.log("Uploading selfie...");
        uploadPromises.push(
          uploadFileToSupabase(documents.selfie.file, `${userId}/selfies`).then(
            (path) => {
              documentPaths.selfie_path = path;
              console.log("Selfie uploaded:", path);
            }
          )
        );
      }

      await Promise.all(uploadPromises);
      console.log("All files uploaded successfully:", documentPaths);

      console.log("Inserting KYC data into database...");
      const kycData = {
        user_id: userId,
        document_type: formData.documentType,
        document_number: formData.documentNumber,
        full_name: formData.fullName,
        date_of_birth: formData.dateOfBirth,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        postal_code: formData.postalCode,
        ...documentPaths,
        status: "pending",
        submitted_at: new Date().toISOString(),
      };

      console.log("KYC data to insert:", kycData);

      const { data: insertData, error: dbError } = await supabase
        .from("kyc_verifications")
        .insert(kycData)
        .select();

      if (dbError) {
        console.error("Database insert error:", dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log("KYC data inserted successfully:", insertData);

      console.log("Updating user KYC status to pending...");
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({ kyc_status: "pending" })
        .eq("id", userId);

      if (userUpdateError) {
        console.error("User update error:", userUpdateError);
        console.log(
          "KYC submitted but user status update failed - this is okay"
        );
      } else {
        console.log("User KYC status updated successfully");
        setKycStatus("pending");
      }

      setSuccess(t.kycSubmittedSuccess);
    } catch (error: any) {
      console.error("KYC submission error:", error);
      setError(`${t.kycSubmissionFailed}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const removeFile = (type: keyof typeof documents) => {
    if (documents[type]?.preview.startsWith("blob:")) {
      URL.revokeObjectURL(documents[type]!.preview);
    }
    setDocuments((prev) => ({
      ...prev,
      [type]: null,
    }));
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="shadow-lg max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b91c1c] mb-4"></div>
            <p className="text-gray-600">{t.checkingKycStatus}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderStatusContent = () => {
    switch (kycStatus) {
      case "approved":
        return (
          <div className="text-center py-8">
            <ShieldCheck className="mx-auto h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              {t.kycApproved}
            </h3>
            <p className="text-gray-600 mb-4">
              {t.kycApprovedMessage}
            </p>
            <Button
              onClick={onKYCComplete}
              className="bg-[#b91c1c] hover:bg-[#991b1b] text-white px-6 py-2"
            >
              {t.continue}
            </Button>
          </div>
        );

      case "pending":
        return (
          <div className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-yellow-600 mb-4" />
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              {t.kycUnderReview}
            </h3>
            <p className="text-gray-600 mb-4">
              {t.kycUnderReviewMessage}
            </p>
            <Alert className="border-yellow-200 bg-yellow-50 text-left">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                {t.kycUnderReviewAlert}
              </AlertDescription>
            </Alert>
          </div>
        );

      case "rejected":
        return (
          <div className="text-center py-8">
            <XCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              {t.kycVerificationFailed}
            </h3>
            <p className="text-gray-600 mb-4">
              {t.kycVerificationFailedMessage}
            </p>
            <Alert variant="destructive" className="text-left mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t.kycRejectionReasons}
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => setKycStatus("not_started")}
              className="bg-[#b91c1c] hover:bg-[#991b1b] text-white px-6 py-2"
            >
              {t.resubmitDocuments}
            </Button>
          </div>
        );

      case "not_started":
      default:
        return (
          <>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmitKYC} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">{t.fullName}</Label>
                  <input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent"
                    required
                    title={t.enterFullName}
                    placeholder={t.enterFullName}
                    aria-describedby="fullName-description"
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">{t.dateOfBirth}</Label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                    className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent"
                    required
                    title={t.dateOfBirth}
                    aria-describedby="dateOfBirth-description"
                  />
                </div>

                <div>
                  <Label htmlFor="documentType">{t.documentType}</Label>
                  <select
                    id="documentType"
                    value={formData.documentType}
                    onChange={(e) =>
                      setFormData({ ...formData, documentType: e.target.value })
                    }
                    className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent"
                    required
                    title={t.documentType}
                    aria-describedby="documentType-description"
                  >
                    <option value="passport">{t.passport}</option>
                    <option value="id_card">{t.nationalIdCard}</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="documentNumber">{t.documentNumber}</Label>
                  <input
                    id="documentNumber"
                    type="text"
                    value={formData.documentNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        documentNumber: e.target.value,
                      })
                    }
                    className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent"
                    required
                    title={t.enterDocumentNumber}
                    placeholder={t.enterDocumentNumber}
                    aria-describedby="documentNumber-description"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">{t.address}</Label>
                  <input
                    id="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent"
                    required
                    title={t.enterAddress}
                    placeholder={t.enterAddress}
                    aria-describedby="address-description"
                  />
                </div>

                <div>
                  <Label htmlFor="city">{t.city}</Label>
                  <input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent"
                    required
                    title={t.enterCity}
                    placeholder={t.enterCity}
                    aria-describedby="city-description"
                  />
                </div>

                <div>
                  <Label htmlFor="country">{t.country}</Label>
                  <input
                    id="country"
                    type="text"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent"
                    required
                    title={t.enterCountry}
                    placeholder={t.enterCountry}
                    aria-describedby="country-description"
                  />
                </div>

                <div>
                  <Label htmlFor="postalCode">{t.postalCode}</Label>
                  <input
                    id="postalCode"
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) =>
                      setFormData({ ...formData, postalCode: e.target.value })
                    }
                    className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#b91c1c] focus:border-transparent"
                    title={t.enterPostalCode}
                    placeholder={t.enterPostalCode}
                    aria-describedby="postalCode-description"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t.requiredDocuments}</h3>

                <DocumentUpload
                  title={t.idDocumentTitle}
                  description={t.idDocumentDescription}
                  file={documents.idDocument}
                  onFileSelect={(file) => handleFileUpload("idDocument", file)}
                  onRemove={() => removeFile("idDocument")}
                  clickToUpload={t.clickToUpload}
                  fileTypeInfo={t.fileTypeInfo}
                />

                <DocumentUpload
                  title={t.utilityBillTitle}
                  description={t.utilityBillDescription}
                  file={documents.utilityBill}
                  onFileSelect={(file) => handleFileUpload("utilityBill", file)}
                  onRemove={() => removeFile("utilityBill")}
                  clickToUpload={t.clickToUpload}
                  fileTypeInfo={t.fileTypeInfo}
                />

                <DocumentUpload
                  title={t.driverLicenseTitle}
                  description={t.driverLicenseDescription}
                  file={documents.driverLicense}
                  onFileSelect={(file) =>
                    handleFileUpload("driverLicense", file)
                  }
                  onRemove={() => removeFile("driverLicense")}
                  clickToUpload={t.clickToUpload}
                  fileTypeInfo={t.fileTypeInfo}
                />

                <DocumentUpload
                  title={t.selfieTitle}
                  description={t.selfieDescription}
                  file={documents.selfie}
                  onFileSelect={(file) => handleFileUpload("selfie", file)}
                  onRemove={() => removeFile("selfie")}
                  clickToUpload={t.clickToUpload}
                  fileTypeInfo={t.fileTypeInfo}
                />
              </div>

              <div className="flex justify-center pt-6">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-8 py-3 bg-[#b91c1c] hover:bg-[#991b1b] text-white font-medium rounded-md transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? t.submittingKyc : t.submitKycVerification}
                </Button>
              </div>
            </form>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1"></div>
              <div className="flex-1 flex justify-center">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {t.kycVerification}
                </CardTitle>
              </div>
              <div className="flex-1 flex justify-end">
                <div className="relative">
                  <Button
                    variant="outline"
                    className="bg-transparent border-[#b91c1c] text-[#b91c1c] hover:bg-[#b91c1c] hover:text-white px-3 py-2 text-sm rounded-md transition-all duration-300 flex items-center gap-2"
                    onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  >
                    <Globe className="h-4 w-4" />
                    {languageNames[language]}
                  </Button>
                  {showLanguageMenu && (
                    <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[140px]">
                      {(Object.keys(languageNames) as Language[]).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm transition-colors"
                          onClick={() => {
                            setLanguage(lang);
                            setShowLanguageMenu(false);
                          }}
                        >
                          {languageNames[lang]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p className="text-gray-600 mt-2">
              {t.kycSubtitle}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {renderStatusContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface DocumentUploadProps {
  title: string;
  description: string;
  file: UploadedFile | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  clickToUpload: string;
  fileTypeInfo: string;
}

function DocumentUpload({
  title,
  description,
  file,
  onFileSelect,
  onRemove,
  clickToUpload,
  fileTypeInfo,
}: DocumentUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        {file && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {!file ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#b91c1c] transition-colors relative">
          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <div className="text-sm text-gray-600 mb-2">
            {clickToUpload}
          </div>
          <div className="text-xs text-gray-500">{fileTypeInfo}</div>
          <label
            htmlFor={`file-upload-${title.replace(/\s+/g, "-").toLowerCase()}`}
            className="sr-only"
          >
            {title}
          </label>
          <input
            id={`file-upload-${title.replace(/\s+/g, "-").toLowerCase()}`}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label={`Upload ${title}`}
            title={`Upload ${title}`}
          />
        </div>
      ) : (
        <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">
              {file.file.name}
            </p>
            <p className="text-xs text-green-600">
              {(file.file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
