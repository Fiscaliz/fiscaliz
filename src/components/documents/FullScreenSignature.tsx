import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { X, RotateCcw, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FullScreenSignatureProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
  documentId: string;
  title?: string;
}

export function FullScreenSignature({
  isOpen,
  onClose,
  onSave,
  documentId,
  title = 'Assinatura do Contribuinte/Preposto'
}: FullScreenSignatureProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize and resize canvas
  useEffect(() => {
    if (!isOpen) return;
    
    const initCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      // Set canvas size to match container
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, rect.width, rect.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    };

    // Small delay to ensure container is rendered
    const timer = setTimeout(initCanvas, 100);
    
    // Handle resize
    const handleResize = () => initCanvas();
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setHasDrawn(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = container.getBoundingClientRect();
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      toast({
        title: 'Assinatura vazia',
        description: 'Por favor, desenhe sua assinatura antes de salvar',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Erro',
          description: 'Usuário não autenticado',
          variant: 'destructive'
        });
        setIsSaving(false);
        return;
      }

      // Create a smaller canvas for the final signature
      const exportCanvas = document.createElement('canvas');
      const exportWidth = 600;
      const exportHeight = 200;
      exportCanvas.width = exportWidth;
      exportCanvas.height = exportHeight;
      
      const exportCtx = exportCanvas.getContext('2d');
      if (!exportCtx) throw new Error('Could not get canvas context');
      
      // Fill white background
      exportCtx.fillStyle = 'white';
      exportCtx.fillRect(0, 0, exportWidth, exportHeight);
      
      // Draw the signature scaled to fit
      exportCtx.drawImage(canvas, 0, 0, exportWidth, exportHeight);

      exportCanvas.toBlob(async (blob) => {
        if (!blob) {
          setIsSaving(false);
          return;
        }

        const fileName = `${user.id}/${documentId}_contributor_signature_${Date.now()}.png`;

        const { error: uploadError } = await supabase.storage
          .from('fiscal-photos')
          .upload(fileName, blob, { upsert: true });

        if (uploadError) {
          toast({
            title: 'Erro ao salvar',
            description: uploadError.message,
            variant: 'destructive'
          });
          setIsSaving(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from('fiscal-photos')
          .getPublicUrl(fileName);

        onSave(urlData.publicUrl);
        onClose();
        
        toast({
          title: 'Assinatura salva',
          description: 'Rubrica capturada com sucesso'
        });
        setIsSaving(false);
      }, 'image/png');
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive'
      });
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          disabled={isSaving}
        >
          <X className="h-5 w-5" />
        </Button>
        
        <h2 className="text-lg font-semibold text-center flex-1 px-4 truncate">
          {title}
        </h2>
        
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Instructions */}
      <div className="p-3 bg-muted/50 text-center">
        <p className="text-sm text-muted-foreground">
          Desenhe sua assinatura na área abaixo
        </p>
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="flex-1 m-4 border-2 border-dashed border-muted-foreground/30 rounded-xl bg-white overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className={cn(
            "touch-none cursor-crosshair w-full h-full",
            isSaving && "opacity-50 pointer-events-none"
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

      {/* Signature line indicator with label */}
      <div className="mx-4 -mt-16 mb-4 pointer-events-none">
        <div className="h-px bg-muted-foreground/40 mx-8" />
        <p className="text-sm font-medium text-foreground text-center mt-2">
          Contribuinte / Preposto
        </p>
        <p className="text-xs text-muted-foreground text-center">
          Assine acima da linha
        </p>
      </div>

      {/* Action Buttons */}
      <div className="p-4 pb-8 border-t bg-background flex gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={clearCanvas}
          disabled={isSaving || !hasDrawn}
          className="flex-1 h-14 text-base"
        >
          <RotateCcw className="h-5 w-5 mr-2" />
          Refazer
        </Button>
        
        <Button
          size="lg"
          onClick={saveSignature}
          disabled={isSaving || !hasDrawn}
          className="flex-1 h-14 text-base bg-gradient-to-r from-primary to-secondary"
        >
          {isSaving ? (
            <>Salvando...</>
          ) : (
            <>
              <Check className="h-5 w-5 mr-2" />
              Salvar Assinatura
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
