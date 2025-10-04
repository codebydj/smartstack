import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  ArrowLeft,
  Download,
  Eye,
  FileText,
  Loader2,
  Lock,
} from "lucide-react";
import { PasswordDialog } from "./PasswordDialog";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";

interface FileData {
  id: string;
  title: string;
  category: string;
  description: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  downloadUrl: string;
}

export function DownloadPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFiles();
    }
  }, [selectedCategory, isAuthenticated]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0c6958dd/categories`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      const data = await response.json();
      if (data.categories && data.categories.length > 0) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0c6958dd/files/approved`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            password,
            category: selectedCategory === "all" ? null : selectedCategory,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch files");
      }

      setFiles(data.files || []);
      // Extract unique file types for the new filter
      if (data.files) {
        const types = [
          ...new Set(
            data.files.map((f: FileData) => getFileExtension(f.fileName))
          ),
        ];
        setAvailableTypes(types.sort());
      }
    } catch (error: any) {
      console.error("Error fetching files:", error);
      toast.error(error.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (pwd: string) => {
    // The try/catch is now primarily for logging.
    // The PasswordDialog will handle showing the error message.
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0c6958dd/files/approved`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ password: pwd, category: null }),
        }
      );

      if (!response.ok) {
        throw new Error("Invalid password. Please try again.");
      }

      setPassword(pwd);
      setIsAuthenticated(true);
      setShowPasswordDialog(false);
      toast.success("Access granted!");
    } catch (error) {
      console.error("Error verifying password:", error);
      // Re-throw the error so the dialog can catch it
      throw error;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  const getFileExtension = useCallback((fileName: string) => {
    const extension = fileName.split(".").pop()?.toUpperCase();
    return extension ? `.${extension}` : ".FILE";
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const typeMatch =
        selectedType === "all" ||
        getFileExtension(file.fileName) === selectedType;
      // Category is already filtered by the API call, but this adds client-side filtering if we change that logic.
      return typeMatch;
    });
  }, [files, selectedType, getFileExtension]);

  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle>Protected Area</CardTitle>
              <CardDescription>
                Enter the download password to access files
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
        <PasswordDialog
          open={showPasswordDialog}
          onOpenChange={setShowPasswordDialog}
          onSuccess={handlePasswordSubmit}
          title="Enter Download Password"
          description="You need a password to access the file library"
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl text-gray-800">Download Files</h1>
              <p className="text-gray-600">
                Browse and download approved files
              </p>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <Label className="text-sm">Category:</Label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all" value="all">
                    All
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label className="text-sm">Type:</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all" value="all">
                    All Types
                  </SelectItem>
                  {availableTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Badge variant="secondary">{filteredFiles.length} files</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Files List */}
        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading files...</span>
              </div>
            </CardContent>
          </Card>
        ) : filteredFiles.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              No files match the current filters.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredFiles.map((file) => (
              <Card key={file.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-blue-600 mt-1 shrink-0" />
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-lg">{file.title}</h3>
                            <Badge variant="secondary">
                              {getFileExtension(file.fileName)}
                            </Badge>
                            <Badge variant="outline">{file.category}</Badge>
                          </div>
                          {file.description && (
                            <p className="text-sm text-gray-600">
                              {file.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-sm text-gray-500">
                            <span>{file.fileName}</span>
                            <span>•</span>
                            <span>{formatFileSize(file.fileSize)}</span>
                            <span>•</span>
                            <span>{formatDate(file.uploadedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 self-start sm:self-auto pt-2 sm:pt-0">
                      {file.downloadUrl && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const previewUrl = `/#/preview?url=${encodeURIComponent(
                                file.downloadUrl
                              )}&type=${encodeURIComponent(
                                file.fileType
                              )}&name=${encodeURIComponent(file.fileName)}`;
                              window.open(previewUrl, "_blank");
                            }}
                            // Disable preview for unsupported types if needed, or let the preview page handle it.
                            // disabled={!['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'text/plain'].includes(file.fileType)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              const a = document.createElement("a");
                              a.href = file.downloadUrl;
                              a.download = file.fileName;
                              a.click();
                              toast.success("Download started");
                            }}>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Label({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <label className={`text-sm ${className}`}>{children}</label>;
}
