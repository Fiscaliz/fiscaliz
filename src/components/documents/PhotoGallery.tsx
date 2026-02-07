import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PhotoGalleryProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  documentId: string;
  maxPhotos?: number;
  readOnly?: boolean;
  label?: string;
}

export function PhotoGallery({
  photos,
  onChange,
  documentId,
  maxPhotos = 10,
  readOnly = false,
  label = 'Registro Fotográfico'
}: PhotoGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado',
        variant: 'destructive'
      });
      return;
    }

    const remainingSlots = maxPhotos - photos.length;
    if (files.length > remainingSlots) {
      toast({
        title: 'Limite de fotos',
        description: `Você pode adicionar no máximo ${remainingSlots} fotos`,
        variant: 'destructive'
      });
      return;
    }

    const newUrls: string[] = [];
    
    for (const file of Array.from(files)) {
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}/${documentId}_photo_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('fiscal-photos')
          .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: signedData } = await supabase.storage
          .from('fiscal-photos')
          .createSignedUrl(fileName, 3600);

        if (signedData?.signedUrl) {
          newUrls.push(signedData.signedUrl);
        }
      } catch (error: any) {
        console.error('Upload error:', error);
        toast({
          title: 'Erro no upload',
          description: error.message || 'Não foi possível enviar a foto',
          variant: 'destructive'
        });
      }
    }

    if (newUrls.length > 0) {
      onChange([...photos, ...newUrls]);
      toast({
        title: 'Fotos adicionadas',
        description: `${newUrls.length} foto(s) adicionada(s) com sucesso`
      });
    }

    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    onChange(newPhotos);
  };

  const handleCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      
      stream.getTracks().forEach(track => track.stop());
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          
          if (fileInputRef.current) {
            fileInputRef.current.files = dataTransfer.files;
            const event = new Event('change', { bubbles: true });
            fileInputRef.current.dispatchEvent(event);
          }
        }
      }, 'image/jpeg', 0.8);
    } catch {
      fileInputRef.current?.click();
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{label}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {photos.length}/{maxPhotos}
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={handleUpload}
        />

        {photos.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {photos.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                <img 
                  src={url} 
                  alt={`Foto ${idx + 1}`} 
                  className="w-full h-full object-cover"
                />
                {!readOnly && (
                  <button
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {!readOnly && photos.length < maxPhotos && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCapture}
              className="flex-1"
            >
              <Camera className="h-4 w-4 mr-1" />
              Capturar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-1" />
              Galeria
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
