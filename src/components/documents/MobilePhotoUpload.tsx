import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X, Upload, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UploadedPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

interface MobilePhotoUploadProps {
  photos: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
  maxPhotos?: number;
  required?: boolean;
  label?: string;
  description?: string;
}

export function MobilePhotoUpload({
  photos,
  onChange,
  maxPhotos = 10,
  required = false,
  label = 'Registro Fotográfico',
  description,
}: MobilePhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxPhotos - photos.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);

    const newPhotos: UploadedPhoto[] = filesToAdd.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    onChange([...photos, ...newPhotos]);

    // Reset input
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    const removed = newPhotos.splice(index, 1)[0];
    if (removed?.previewUrl) {
      URL.revokeObjectURL(removed.previewUrl);
    }
    onChange(newPhotos);
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const openGallery = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className={cn(
      "border-0 shadow-sm",
      required && photos.length === 0 && "border-2 border-destructive"
    )}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{label}</span>
            {required && (
              <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">
                Obrigatório
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {photos.length}/{maxPhotos}
          </span>
        </div>

        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}

        {/* Hidden file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Photo grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {photos.map((photo, idx) => (
              <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
                <img 
                  src={photo.previewUrl} 
                  alt={`Foto ${idx + 1}`} 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload buttons - always visible if under max */}
        {photos.length < maxPhotos && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openCamera}
              className="flex-1 h-12"
            >
              <Camera className="h-5 w-5 mr-2" />
              Capturar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openGallery}
              className="flex-1 h-12"
            >
              <Upload className="h-5 w-5 mr-2" />
              Galeria
            </Button>
          </div>
        )}

        {/* Required warning */}
        {required && photos.length === 0 && (
          <p className="text-xs text-destructive flex items-center gap-1">
            ⚠️ É obrigatório anexar pelo menos uma foto
          </p>
        )}
      </CardContent>
    </Card>
  );
}
