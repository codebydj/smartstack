import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "./ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

export function PreviewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const fileUrl = useMemo(() => searchParams.get("url"), [searchParams]);
  const fileType = useMemo(() => searchParams.get("type"), [searchParams]);
  const fileName = useMemo(
    () => searchParams.get("name") || "file",
    [searchParams]
  );

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const isOfficeDocument = useMemo(() => {
    return fileType?.startsWith(
      "application/vnd.openxmlformats-officedocument"
    );
  }, [fileType]);

  useEffect(() => {
    if (!fileUrl || !fileType) {
      setError("The file URL or type is missing.");
      setIsLoading(false);
      return;
    }

    if (fileType.startsWith("image/") || isOfficeDocument) {
      setObjectUrl(fileUrl);
      setIsLoading(false);
      return;
    }

    const fetchFile = async () => {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        const blob = await response.blob();
        const objUrl = URL.createObjectURL(blob);
        setObjectUrl(objUrl);
      } catch (err: any) {
        console.error("Error fetching file for preview:", err);
        setError(err.message || "Could not load file for preview.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFile();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl, fileType, isOfficeDocument]);

  const renderContent = () => {
    if (isLoading) {
      return <Loader2 className="w-12 h-12 animate-spin text-gray-500" />;
    }

    if (error || !objectUrl) {
      return (
        <h2 className="text-2xl font-semibold text-red-600">Preview Failed</h2>
      );
    }

    if (fileType?.startsWith("image/")) {
      return (
        <img
          src={objectUrl}
          alt={fileName}
          className="max-w-full max-h-full object-contain"
        />
      );
    }

    if (isOfficeDocument) {
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
        objectUrl
      )}`;
      return (
        <iframe
          src={officeViewerUrl}
          title={fileName}
          className="w-full h-full border-0"
        />
      );
    }

    if (
      fileType === "application/pdf" ||
      fileType?.startsWith("text/") ||
      fileType?.startsWith("video/") ||
      fileType?.startsWith("audio/")
    ) {
      return (
        <iframe
          src={objectUrl}
          title={fileName}
          className="w-full h-full border-0"
        />
      );
    }

    return (
      <div className="text-center">
        <p className="text-lg text-gray-700">
          Preview is not available for this file type ({fileType}).
        </p>
        <p className="text-sm text-gray-500 mt-2">
          You can still{" "}
          <Link
            to={objectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-600">
            download the file
          </Link>{" "}
          directly.
        </p>
      </div>
    );
  };

  return (
    <div className="w-screen h-screen bg-gray-200">
      {/* Go Back button stays above preview */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70 z-10">
        <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
      </Button>

      <div className="w-full h-full flex items-center justify-center">
        {renderContent()}
      </div>
    </div>
  );
}
