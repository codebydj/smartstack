import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Upload, Download, Settings, FileStack } from "lucide-react";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center items-center gap-3 mb-4">
            <FileStack className="w-12 h-12 text-indigo-600" />
            <h1 className="text-5xl text-indigo-600">SmartStack</h1>
          </div>
          <p className="text-xl text-gray-600">
            Your intelligent file management system
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Upload Card */}
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/upload")}>
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Upload Files</CardTitle>
              <CardDescription>
                Upload documents and resources for approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/upload");
                }}>
                Start Uploading
              </Button>
            </CardContent>
          </Card>

          {/* Download Card */}
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/download")}>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Download Files</CardTitle>
              <CardDescription>
                Access approved files by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/download");
                }}>
                Browse Files
              </Button>
            </CardContent>
          </Card>

          {/* Admin Card */}
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/admin")}>
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Admin Panel</CardTitle>
              <CardDescription>
                Manage files, approvals, and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/admin");
                }}>
                Admin Access
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-gray-500">
          <p>Secure file management with approval workflows</p>
        </div>
      </div>
    </div>
  );
}
