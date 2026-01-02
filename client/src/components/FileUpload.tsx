import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in MB
  onFileSelect: (file: File | null) => void;
  onUploadComplete?: (url: string) => void;
  label?: string;
  hint?: string;
  className?: string;
}

export function FileUpload({
  accept = ".pdf,.doc,.docx",
  maxSize = 5,
  onFileSelect,
  onUploadComplete,
  label = "Upload File",
  hint = "PDF, DOC, DOCX (max 5MB)",
  className,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    setUploadedUrl(null);

    if (!selectedFile) {
      setFile(null);
      onFileSelect(null);
      return;
    }

    // Validate file size
    if (selectedFile.size > maxSize * 1024 * 1024) {
      setError(`File size exceeds ${maxSize}MB limit`);
      return;
    }

    // Validate file type
    const allowedTypes = accept.split(",").map(t => t.trim().toLowerCase());
    const fileExt = "." + selectedFile.name.split(".").pop()?.toLowerCase();
    if (!allowedTypes.some(t => t === fileExt || selectedFile.type.includes(t.replace(".", "")))) {
      setError("Invalid file type");
      return;
    }

    setFile(selectedFile);
    onFileSelect(selectedFile);

    // Upload file
    await uploadFile(selectedFile);
  };

  const uploadFile = async (fileToUpload: File) => {
    setUploading(true);
    setProgress(0);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("file", fileToUpload);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Upload to server
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setProgress(100);
      setUploadedUrl(data.url);
      onUploadComplete?.(data.url);
    } catch (err) {
      setError("Upload failed. Please try again.");
      setFile(null);
      onFileSelect(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setUploadedUrl(null);
    setProgress(0);
    setError(null);
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && inputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(droppedFile);
      inputRef.current.files = dataTransfer.files;
      handleFileChange({ target: inputRef.current } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
      />

      {!file ? (
        <label
          htmlFor="file-upload"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={cn(
            "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer",
            "bg-secondary/30 hover:bg-secondary/50 transition-colors",
            "border-border hover:border-primary/50",
            error && "border-destructive"
          )}
        >
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted-foreground">{hint}</span>
        </label>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border">
          <div className="flex-shrink-0">
            {uploadedUrl ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <FileText className="h-8 w-8 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            {uploading && (
              <Progress value={progress} className="h-1 mt-2" />
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
