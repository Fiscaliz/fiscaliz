import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Camera, Upload, X, PenTool, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SignatureCaptureProps {
  label: string;
  name: string;
  cpf: string;
  photoUrl: string | null;
  signatureUrl: string | null;
  onNameChange: (name: string) => void;
  onCpfChange: (cpf: string) => void;
  onPhotoChange: (url: string | null) => void;
  onSignatureChange: (url: string | null) => void;
  documentId: string;
  readOnly?: boolean;
  optional?: boolean;
}

export function SignatureCapture({
  label,
  name,
  cpf,
  photoUrl,
  signatureUrl,
  onNameChange,
  onCpfChange,
  onPhotoChange,
  onSignatureChange,
  documentId,
  readOnly = false,
  optional = true,
}: SignatureCaptureProps) {
  const [mode, setMode] = useState<'photo' | 'signature'>('photo');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e 
      ? e.touches[0].clientX - rect.left 
      : e.clientX - rect.left;
    const y = 'touches' in e 
      ? e.touches[0].clientY - rect.top 
      : e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || readOnly) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e 
      ? e.touches[0].clientX - rect.left 
      : e.clientX - rect.left;
    const y = 'touches' in e 
      ? e.touches[0].clientY - rect.top 
      : e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onSignatureChange(null);
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado',
        variant: 'destructive'
      });
      return;
    }

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      try {
        const fileName = `${user.id}/${documentId}_signature_${Date.now()}.png`;

        const { error: uploadError } = await supabase.storage
          .from('fiscal-photos')
          .upload(fileName, blob, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('fiscal-photos')
          .getPublicUrl(fileName);

        onSignatureChange(urlData.publicUrl);
        
        toast({
          title: 'Assinatura salva',
          description: 'Assinatura capturada com sucesso'
        });
      } catch (error: any) {
        console.error('Upload error:', error);
        toast({
          title: 'Erro ao salvar',
          description: error.message || 'Não foi possível salvar a assinatura',
          variant: 'destructive'
        });
      }
    }, 'image/png');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado',
        variant: 'destructive'
      });
      return;
    }

    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${documentId}_contributor_photo_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('fiscal-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('fiscal-photos')
        .getPublicUrl(fileName);

      onPhotoChange(urlData.publicUrl);
      
      toast({
        title: 'Foto adicionada',
        description: 'Foto capturada com sucesso'
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível enviar a foto',
        variant: 'destructive'
      });
    }

    e.target.value = '';
  };

  const handleCapturePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
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
          const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
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
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{label}</Label>
          {optional && (
            <span className="text-xs text-muted-foreground">(opcional)</span>
          )}
        </div>

        {/* Name and CPF */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="contributor-name" className="text-xs">Nome</Label>
            <Input
              id="contributor-name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Nome do responsável"
              disabled={readOnly}
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="contributor-cpf" className="text-xs">CPF</Label>
            <Input
              id="contributor-cpf"
              value={cpf}
              onChange={(e) => onCpfChange(e.target.value)}
              placeholder="000.000.000-00"
              disabled={readOnly}
              className="text-sm"
            />
          </div>
        </div>

        {/* Mode Toggle */}
        {!readOnly && (
          <div className="flex gap-2">
            <Button
              variant={mode === 'photo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('photo')}
              className="flex-1"
            >
              <Camera className="h-4 w-4 mr-1" />
              Foto
            </Button>
            <Button
              variant={mode === 'signature' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('signature')}
              className="flex-1"
            >
              <PenTool className="h-4 w-4 mr-1" />
              Rubrica
            </Button>
          </div>
        )}

        {/* Photo Mode */}
        {mode === 'photo' && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            {photoUrl ? (
              <div className="relative inline-block">
                <img 
                  src={photoUrl} 
                  alt="Foto do responsável" 
                  className="w-24 h-24 object-cover rounded-lg border"
                />
                {!readOnly && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => onPhotoChange(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ) : !readOnly && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCapturePhoto}
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Capturar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Galeria
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Signature Mode */}
        {mode === 'signature' && (
          <div className="space-y-2">
            {signatureUrl ? (
              <div className="relative inline-block">
                <img 
                  src={signatureUrl} 
                  alt="Assinatura" 
                  className="h-20 border rounded-lg bg-white"
                />
                {!readOnly && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => onSignatureChange(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ) : !readOnly && (
              <>
                <div className="border rounded-lg overflow-hidden bg-white">
                  <canvas
                    ref={canvasRef}
                    width={280}
                    height={100}
                    className={cn(
                      "touch-none cursor-crosshair w-full",
                      readOnly && "cursor-not-allowed opacity-50"
                    )}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSignature}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveSignature}
                    className="flex-1"
                  >
                    Salvar Assinatura
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
