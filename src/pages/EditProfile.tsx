import { useEffect, useMemo, useState, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Pen, Upload, X, Image } from 'lucide-react';

export default function EditProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const signatureFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);

  const defaultFullName = useMemo(
    () => (user?.user_metadata as any)?.full_name || user?.email?.split('@')[0] || '',
    [user]
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(defaultFullName);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [division, setDivision] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, registration_number, division, phone, email, signature_url')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
      }

      if (data) {
        setFullName(data.full_name || defaultFullName);
        setRegistrationNumber(data.registration_number || '');
        setDivision(data.division || '');
        setPhone(data.phone || '');
        setEmail(data.email || user.email || '');
        setSignatureUrl(data.signature_url || null);
      } else {
        setEmail(user.email || '');
      }

      setLoading(false);
    };

    load();
  }, [user, defaultFullName]);

  // Signature pad functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !user) return;

    const dataUrl = canvas.toDataURL('image/png');
    const blob = await (await fetch(dataUrl)).blob();
    const fileName = `signatures/${user.id}-${Date.now()}.png`;

    const { data, error } = await supabase.storage
      .from('fiscal-photos')
      .upload(fileName, blob, { upsert: true });

    if (error) {
      toast({ title: 'Erro ao salvar rubrica', variant: 'destructive' });
      return;
    }

    const { data: urlData } = supabase.storage.from('fiscal-photos').getPublicUrl(fileName);
    setSignatureUrl(urlData.publicUrl);
    setShowSignaturePad(false);
    toast({ title: 'Rubrica salva!', description: 'Clique em Salvar para confirmar as alterações.' });
  };

  const handleSave = async () => {
    if (!user) return;

    if (!fullName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe seu nome para constar na assinatura dos documentos.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName.trim(),
          registration_number: registrationNumber.trim() || null,
          division: division.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          signature_url: signatureUrl,
        });

      if (upsertError) throw upsertError;

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          registration_number: registrationNumber.trim() || undefined,
          division: division.trim() || undefined,
        },
      });

      if (authError) {
        console.warn('Could not update user metadata:', authError);
      }

      toast({
        title: 'Perfil atualizado',
        description: 'Sua assinatura passará a constar corretamente nos documentos.',
      });
    } catch (e: any) {
      toast({
        title: 'Erro ao salvar',
        description: e?.message || 'Não foi possível salvar o perfil.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <Header title="Editar Perfil" showBack />
      <div className="p-4">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Dados para assinatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex.: Fulano de Tal"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">Incluído automaticamente no envio de documentos</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="registration">Matrícula</Label>
                <Input
                  id="registration"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="Ex.: 123456"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(62) 9...."
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="division">Coordenação / Lotação</Label>
              <Input
                id="division"
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                placeholder="Ex.: Coordenação de Fiscalização de Alimentos"
                disabled={loading}
              />
            </div>

            {/* Signature Section */}
            <div className="space-y-3">
              <Label>Rubrica / Assinatura Digital</Label>
              {signatureUrl ? (
                <div className="flex items-center gap-3 p-4 border rounded-xl bg-muted/30">
                  <img src={signatureUrl} alt="Rubrica" className="h-16 w-auto border rounded bg-white" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Rubrica cadastrada</p>
                    <p className="text-xs text-muted-foreground">Visível em todos os documentos</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSignatureUrl(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-20 border-dashed flex-col gap-2"
                    onClick={() => setShowSignaturePad(true)}
                    disabled={loading}
                  >
                    <Pen className="h-5 w-5" />
                    <span className="text-xs">Desenhar rubrica</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 border-dashed flex-col gap-2"
                    onClick={() => signatureFileInputRef.current?.click()}
                    disabled={loading || isUploadingSignature}
                  >
                    <Image className="h-5 w-5" />
                    <span className="text-xs">{isUploadingSignature ? 'Enviando...' : 'Upload de imagem'}</span>
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Esta rubrica será usada em todos os documentos fiscais</p>
              
              {/* Hidden file input for signature upload */}
              <input
                ref={signatureFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !user) return;
                  
                  setIsUploadingSignature(true);
                  try {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `signatures/${user.id}-upload-${Date.now()}.${fileExt}`;
                    
                    const { error: uploadError } = await supabase.storage
                      .from('fiscal-photos')
                      .upload(fileName, file, { upsert: true });
                    
                    if (uploadError) throw uploadError;
                    
                    const { data: urlData } = supabase.storage
                      .from('fiscal-photos')
                      .getPublicUrl(fileName);
                    
                    setSignatureUrl(urlData.publicUrl);
                    toast({ 
                      title: 'Imagem de assinatura carregada!',
                      description: 'Clique em Salvar para confirmar as alterações.'
                    });
                  } catch (err: any) {
                    toast({ 
                      title: 'Erro ao fazer upload', 
                      description: err.message,
                      variant: 'destructive' 
                    });
                  } finally {
                    setIsUploadingSignature(false);
                    // Reset input
                    if (signatureFileInputRef.current) {
                      signatureFileInputRef.current.value = '';
                    }
                  }
                }}
              />
            </div>

            {/* Signature Pad Modal */}
            {showSignaturePad && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-md">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Desenhe sua rubrica</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setShowSignaturePad(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border rounded-lg bg-white">
                      <canvas
                        ref={canvasRef}
                        width={350}
                        height={150}
                        className="w-full touch-none cursor-crosshair"
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
                      <Button variant="outline" className="flex-1" onClick={clearSignature}>
                        Limpar
                      </Button>
                      <Button className="flex-1" onClick={saveSignature}>
                        Salvar Rubrica
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <Button className="w-full" onClick={handleSave} disabled={loading || saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
