import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, Video, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing?: boolean;
  className?: string;
}

const UploadZone: React.FC<UploadZoneProps> = ({
  onFileSelect,
  isProcessing = false,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, []);

  const handleFile = (file: File) => {
    setFileName(file.name);
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
    
    onFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const clearSelection = () => {
    setPreview(null);
    setFileName(null);
  };

  return (
    <div className={cn('glass-card p-6', className)}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300',
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary/50',
          isProcessing && 'pointer-events-none opacity-50'
        )}
      >
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="max-h-64 mx-auto rounded-lg"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={clearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Drop your file here
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse from your computer
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                Images
              </span>
              <span className="flex items-center gap-1">
                <Video className="h-4 w-4" />
                Videos
              </span>
            </div>
          </>
        )}

        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
      </div>

      {fileName && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground truncate">{fileName}</span>
          {isProcessing && (
            <span className="text-primary animate-pulse">Processing...</span>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadZone;
