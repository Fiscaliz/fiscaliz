import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileText, AlertCircle } from 'lucide-react';
import logoFiscaliz from '@/assets/logo-fiscaliz.png';

export default function PDFRedirect() {
  const { fileName } = useParams<{ fileName: string }>();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('u');
  
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!fileName || !userId) {
      setStatus('error');
      setErrorMessage('Link inválido. Parâmetros ausentes.');
      return;
    }

    // Construir o caminho completo do arquivo
    const filePath = `${userId}/${fileName}`;
    
    // Obter URL pública do storage
    const { data } = supabase.storage
      .from('fiscal-photos')
      .getPublicUrl(filePath);
    
    if (data?.publicUrl) {
      setStatus('redirecting');
      // Pequeno delay para mostrar a tela de loading
      setTimeout(() => {
        window.location.href = data.publicUrl;
      }, 500);
    } else {
      setStatus('error');
      setErrorMessage('Documento não encontrado.');
    }
  }, [fileName, userId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <img 
            src={logoFiscaliz} 
            alt="Fiscaliz" 
            className="h-16 object-contain"
          />
        </div>

        {status === 'loading' && (
          <>
            <div className="flex justify-center">
              <div className="bg-primary/10 rounded-full p-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Carregando documento...
              </h1>
              <p className="text-muted-foreground mt-2">
                Aguarde enquanto localizamos seu arquivo.
              </p>
            </div>
          </>
        )}

        {status === 'redirecting' && (
          <>
            <div className="flex justify-center">
              <div className="bg-primary/10 rounded-full p-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Documento encontrado!
              </h1>
              <p className="text-muted-foreground mt-2">
                Redirecionando para o PDF...
              </p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center">
              <div className="bg-destructive/10 rounded-full p-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Documento não encontrado
              </h1>
              <p className="text-muted-foreground mt-2">
                {errorMessage}
              </p>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Vigilância Sanitária de Goiânia
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Documento gerado por <strong>FISCALIZ®</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
