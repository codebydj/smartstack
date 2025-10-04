import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  Plus,
  Lock,
  AlertCircle,
  Loader2,
  GripVertical,
} from "lucide-react";
import { PasswordDialog } from "./PasswordDialog";
import { PasswordInput } from "./PasswordInput";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";

interface FileData {
  id: string;
  title: string;
  category: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export function AdminPanel() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(true);
  const [files, setFiles] = useState<FileData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingFile, setEditingFile] = useState<FileData | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [passwords, setPasswords] = useState({
    download: "",
    admin: "",
  });
  // State for drag-and-drop
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFiles();
      fetchCategories();
    }
  }, [isAuthenticated]);

  const handlePasswordSubmit = async (password: string) => {
    // The try/catch is now primarily for logging.
    // The PasswordDialog will handle showing the error message.
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0c6958dd/admin/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ password }),
        }
      );

      const data = await response.json();

      if (!data.valid) {
        throw new Error("Invalid admin password. Please try again.");
      }

      setIsAuthenticated(true);
      setShowPasswordDialog(false);
      toast.success("Admin access granted!");
    } catch (error) {
      console.error("Error verifying password:", error);
      // Re-throw the error so the dialog can catch it
      throw error;
    }
  };

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0c6958dd/admin/files`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

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
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleApprove = async (fileId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0c6958dd/admin/approve/${fileId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to approve");

      toast.success("File approved successfully");
      fetchFiles();
    } catch (error) {
      console.error("Error approving file:", error);
      toast.error("Failed to approve file");
    }
  };

  const handleReject = async (fileId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0c6958dd/admin/reject/${fileId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to reject");

      toast.success("File rejected");
      fetchFiles();
    } catch (error) {
      console.error("Error rejecting file:", error);
      toast.error("Failed to reject file");
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0c6958dd/admin/file/${fileId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete");

      toast.success("File deleted successfully");
      fetchFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    }
  };

  const handleUpdateFile = async () => {
    if (!editingFile) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0c6958dd/admin/file/${editingFile.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            title: editingFile.title,
            category: editingFile.category,
            description: editingFile.description,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update");

      toast.success("File updated successfully");
      setEditingFile(null);
      fetchFiles();
    } catch (error) {
      console.error("Error updating file:", error);
      toast.error("Failed to update file");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0c6958dd/admin/categories`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ name: newCategory }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add category");
      }

      toast.success("Category added successfully");
      setNewCategory("");
      fetchCategories();
    } catch (error: any) {
      console.error("Error adding category:", error);
      toast.error(error.message || "Failed to add category");
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    if (
      !confirm(
        `Delete category "${categoryName}"? Files in this category will not be deleted.`
      )
    )
      return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0c6958dd/admin/categories/${encodeURIComponent(
          categoryName
        )}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete category");

      toast.success("Category deleted successfully");
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    }
  };

  const handleUpdatePasswords = async () => {
    if (!passwords.download && !passwords.admin) {
      toast.error("Enter at least one password to update");
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0c6958dd/admin/passwords`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            downloadPassword: passwords.download || undefined,
            adminPassword: passwords.admin || undefined,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update passwords");

      toast.success("Passwords updated successfully");
      setPasswords({ download: "", admin: "" });
    } catch (error) {
      console.error("Error updating passwords:", error);
      toast.error("Failed to update passwords");
    }
  };

  const handleCategoryDragSort = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;

    // Create a new sorted array
    const newCategories = [...categories];
    const draggedItemContent = newCategories.splice(dragItem.current, 1)[0];
    newCategories.splice(dragOverItem.current, 0, draggedItemContent);

    // Reset refs
    dragItem.current = null;
    dragOverItem.current = null;

    // Update state and persist to backend
    setCategories(newCategories);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0c6958dd/admin/categories`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ categories: newCategories }),
        }
      );

      if (!response.ok) throw new Error("Failed to save order");
      toast.success("Category order saved");
    } catch (error) {
      toast.error("Failed to save new category order.");
      fetchCategories(); // Re-fetch to revert optimistic update
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getFileExtension = useCallback((fileName: string) => {
    const extension = fileName.split(".").pop()?.toUpperCase();
    return extension ? `.${extension}` : ".FILE";
  }, []);

  const pendingFiles = files.filter((f) => f.status === "pending");
  const approvedFiles = files.filter((f) => f.status === "approved");
  const rejectedFiles = files.filter((f) => f.status === "rejected");

  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle>Admin Access Required</CardTitle>
              <CardDescription>
                Enter the admin password to access the control panel
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
        <PasswordDialog
          open={showPasswordDialog}
          onOpenChange={setShowPasswordDialog}
          onSuccess={handlePasswordSubmit}
          title="Enter Admin Password"
          description="You need admin privileges to access this panel"
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl text-gray-800">Admin Panel</h1>
            <p className="text-gray-600">
              Manage files, approvals, and system settings
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">
              Pending ({pendingFiles.length})
            </TabsTrigger>
            <TabsTrigger value="all">All Files ({files.length})</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Pending Files Tab */}
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>
                  Review and approve or reject uploaded files
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  </div>
                ) : pendingFiles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No pending files</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingFiles.map((file) => (
                      <div
                        key={file.id}
                        className="border rounded-lg p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-medium">{file.title}</h3>
                              <Badge variant="secondary">
                                {getFileExtension(file.fileName)}
                              </Badge>
                              <Badge variant="outline">{file.category}</Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {file.description}
                            </p>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500 pt-1">
                              <span>{file.fileName}</span>
                              <span>•</span>
                              <span>{formatFileSize(file.fileSize)}</span>
                              <span>•</span>
                              <span>{formatDate(file.uploadedAt)}</span>
                            </div>
                          </div>
                          <div className="shrink-0">
                            {getStatusBadge(file.status)}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(file.id)}
                            className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(file.id)}>
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Files Tab */}
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Files</CardTitle>
                <CardDescription>
                  View and manage all uploaded files
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="border rounded-lg p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-medium">{file.title}</h3>
                              <Badge variant="secondary">
                                {getFileExtension(file.fileName)}
                              </Badge>
                              <Badge variant="outline">{file.category}</Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {file.description}
                            </p>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500 pt-1">
                              <span>{file.fileName}</span>
                              <span>•</span>
                              <span>{formatFileSize(file.fileSize)}</span>
                              <span>•</span>
                              <span>{formatDate(file.uploadedAt)}</span>
                            </div>
                          </div>
                          <div className="shrink-0">
                            {getStatusBadge(file.status)}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {file.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(file.id)}
                                className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(file.id)}>
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingFile(file)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(file.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Category Management</CardTitle>
                <CardDescription>Add or remove file categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Category */}
                <div className="flex gap-2">
                  <Input
                    placeholder="New category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                  />
                  <Button onClick={handleAddCategory}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>

                {/* Categories List */}
                <div className="space-y-2">
                  {categories.map((category, index) => (
                    <div
                      key={category}
                      className="flex items-center justify-between p-2 border rounded-lg bg-white"
                      draggable
                      onDragStart={() => (dragItem.current = index)}
                      onDragEnter={() => (dragOverItem.current = index)}
                      onDragEnd={handleCategoryDragSort}
                      onDragOver={(e) => e.preventDefault()}>
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                        <span>{category}</span>
                      </div>
                      <div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-500 hover:text-red-600"
                          onClick={() => handleDeleteCategory(category)}>
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Password Settings</CardTitle>
                <CardDescription>
                  Update download and admin passwords
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="download-pwd">New Download Password</Label>
                  <PasswordInput
                    id="download-pwd"
                    placeholder="Leave blank to keep current"
                    value={passwords.download}
                    onChange={(e) =>
                      setPasswords({ ...passwords, download: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-pwd">New Admin Password</Label>
                  <PasswordInput
                    id="admin-pwd"
                    placeholder="Leave blank to keep current"
                    value={passwords.admin}
                    onChange={(e) =>
                      setPasswords({ ...passwords, admin: e.target.value })
                    }
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleUpdatePasswords}>
                    Update Passwords
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <p className="text-sm text-yellow-800">
                  <strong>Default Passwords:</strong> Download:{" "}
                  <code>download123</code> | Admin: <code>admin123</code>
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit File Dialog */}
        <Dialog open={!!editingFile} onOpenChange={() => setEditingFile(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit File</DialogTitle>
              <DialogDescription>Update file metadata</DialogDescription>
            </DialogHeader>
            {editingFile && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editingFile.title}
                    onChange={(e) =>
                      setEditingFile({ ...editingFile, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={editingFile.category}
                    onValueChange={(value) =>
                      setEditingFile({ ...editingFile, category: value })
                    }>
                    <SelectTrigger id="edit-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={editingFile.description}
                    onChange={(e) =>
                      setEditingFile({
                        ...editingFile,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setEditingFile(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateFile}>Save Changes</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
