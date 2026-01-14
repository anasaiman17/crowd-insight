import React, { useState } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Video, 
  Trash2, 
  Scan, 
  Users, 
  Eye,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGallery, GalleryItem } from '@/hooks/useGallery';
import { useToast } from '@/hooks/use-toast';
import DetectionCanvas from '@/components/DetectionCanvas';
import AuthGuard from '@/components/AuthGuard';
import { cn } from '@/lib/utils';

const Gallery: React.FC = () => {
  const { items, isLoading, upload, isUploading, analyze, isAnalyzing, deleteItem, isDeleting } = useGallery();
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [viewItem, setViewItem] = useState<GalleryItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload images or videos only.',
          variant: 'destructive',
        });
        continue;
      }

      try {
        const item = await upload(file);
        toast({
          title: 'Upload successful',
          description: `${file.name} has been uploaded.`,
        });

        // Auto-analyze images
        if (item.file_type === 'image') {
          await analyze(item);
          toast({
            title: 'Analysis complete',
            description: `Detected ${item.people_count || 0} people.`,
          });
        }
      } catch (error: any) {
        toast({
          title: 'Upload failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFiles(files);
    e.target.value = '';
  };

  const handleAnalyze = async (item: GalleryItem) => {
    try {
      const result = await analyze(item);
      toast({
        title: 'Analysis complete',
        description: `Detected ${result.people_count} people.`,
      });
    } catch (error: any) {
      toast({
        title: 'Analysis failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (item: GalleryItem) => {
    try {
      await deleteItem(item);
      toast({
        title: 'Deleted',
        description: 'File has been removed.',
      });
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getDensityColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      default:
        return 'bg-green-500/20 text-green-500 border-green-500/30';
    }
  };

  return (
    <AuthGuard>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gallery</h1>
            <p className="text-muted-foreground mt-1">
              Upload and analyze photos & videos for crowd detection
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {items.length} item{items.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Upload Zone */}
        <Card
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'relative border-2 border-dashed p-8 text-center transition-all cursor-pointer',
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50',
            (isUploading || isAnalyzing) && 'pointer-events-none opacity-50'
          )}
        >
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading || isAnalyzing}
          />
          
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            {isUploading || isAnalyzing ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-primary" />
            )}
          </div>
          
          <h3 className="text-lg font-semibold mb-2">
            {isUploading ? 'Uploading...' : isAnalyzing ? 'Analyzing...' : 'Drop files here'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            or click to browse from your computer
          </p>
          
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Images (auto-analyzed)
            </span>
            <span className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Videos
            </span>
          </div>
        </Card>

        {/* Gallery Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No files yet</h3>
            <p className="text-muted-foreground">
              Upload images or videos to start analyzing crowds
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <Card 
                key={item.id} 
                className="overflow-hidden group hover:ring-2 hover:ring-primary/50 transition-all"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-secondary">
                  {item.file_type === 'image' ? (
                    <img
                      src={item.file_url}
                      alt={item.file_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => setViewItem(item)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {item.file_type === 'image' && item.analysis_status !== 'processing' && (
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleAnalyze(item)}
                        disabled={isAnalyzing}
                      >
                        <Scan className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(item)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Type Badge */}
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 left-2"
                  >
                    {item.file_type === 'image' ? (
                      <ImageIcon className="h-3 w-3 mr-1" />
                    ) : (
                      <Video className="h-3 w-3 mr-1" />
                    )}
                    {item.file_type}
                  </Badge>

                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    {getStatusIcon(item.analysis_status)}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <p className="text-sm font-medium truncate" title={item.file_name}>
                    {item.file_name}
                  </p>
                  
                  {item.analysis_status === 'completed' && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{item.people_count} people</span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn('text-xs', getDensityColor(item.density_level))}
                      >
                        {item.density_level}
                      </Badge>
                    </div>
                  )}
                  
                  {item.analysis_status === 'processing' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Analyzing...
                    </div>
                  )}
                  
                  {item.analysis_status === 'pending' && item.file_type === 'image' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleAnalyze(item)}
                      disabled={isAnalyzing}
                    >
                      <Scan className="h-3 w-3 mr-1" />
                      Analyze
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* View Dialog */}
        <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {viewItem?.file_type === 'image' ? (
                  <ImageIcon className="h-5 w-5" />
                ) : (
                  <Video className="h-5 w-5" />
                )}
                {viewItem?.file_name}
              </DialogTitle>
            </DialogHeader>
            
            {viewItem && (
              <div className="space-y-4">
                {viewItem.file_type === 'image' ? (
                  viewItem.analysis_status === 'completed' && viewItem.detected_persons.length > 0 ? (
                    <DetectionCanvas
                      imageUrl={viewItem.file_url}
                      detections={viewItem.detected_persons}
                      showFilter={true}
                    />
                  ) : (
                    <img
                      src={viewItem.file_url}
                      alt={viewItem.file_name}
                      className="w-full rounded-lg"
                    />
                  )
                ) : (
                  <video
                    src={viewItem.file_url}
                    controls
                    className="w-full rounded-lg"
                  />
                )}

                {viewItem.analysis_status === 'completed' && (
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4 text-center">
                      <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{viewItem.people_count}</p>
                      <p className="text-sm text-muted-foreground">People Detected</p>
                    </Card>
                    <Card className="p-4 text-center">
                      <Badge className={cn('mb-2', getDensityColor(viewItem.density_level))}>
                        {viewItem.density_level}
                      </Badge>
                      <p className="text-sm text-muted-foreground">Density Level</p>
                    </Card>
                    <Card className="p-4 text-center">
                      <p className="text-2xl font-bold">{Math.round(viewItem.confidence_avg * 100)}%</p>
                      <p className="text-sm text-muted-foreground">Avg Confidence</p>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  );
};

export default Gallery;
