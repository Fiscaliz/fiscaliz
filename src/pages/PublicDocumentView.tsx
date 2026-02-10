import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileText, AlertCircle } from 'lucide-react';
import logoFiscaliz from '@/assets/logo-fiscaliz.png';

export default function PublicDocumentView() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<'loading' | 'found' | 'error'>('loading');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!id) {
      setStatus('error');
      setErrorMessage('Link inválido. ID do documento ausente.');
      return;
    }

    const fetchDocument = async () => {
      // Try to get the document's PDF URL
      const { data, error } = await supabase
        .from('fiscal_documents')
        .select('pdf_url, document_number, document_type')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        setStatus('error');
        setErrorMessage('Documento não encontrado ou acesso não autorizado.');
        return;
      }

      if (data.pdf_url) {
        // If there's a stored PDF URL, redirect to it
        setPdfUrl(data.pdf_url);
        setStatus('found');
      } else {
        // No PDF generated yet
        setStatus('error');
        setErrorMessage('O PDF deste documento ainda não foi gerado. Solicite ao fiscal responsável.');
      }
    };

    fetchDocument();
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <img src={logoFiscaliz} alt="Fiscaliz" className="h-16 object-contain" />
        </div>

        {status === 'loading' && (
          <>
            <div className="flex justify-center">
              <div className="bg-primary/10 rounded-full p-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Carregando documento...</h1>
              <p className="text-muted-foreground mt-2">Aguarde enquanto localizamos o documento.</p>
            </div>
          </>
        )}

        {status === 'found' && pdfUrl && (
          <>
            <div className="flex justify-center">
              <div className="bg-primary/10 rounded-full p-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Documento encontrado!</h1>
              <p className="text-muted-foreground mt-2">Clique abaixo para visualizar o documento.</p>
            </div>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary/90 transition-colors"
            >
              <FileText className="h-5 w-5" />
              Abrir Documento
            </a>
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
              <h1 className="text-xl font-semibold text-foreground">Documento não disponível</h1>
              <p className="text-muted-foreground mt-2">{errorMessage}</p>
            </div>
          </>
        )}

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">Vigilância Sanitária de Goiânia</p>
          <p className="text-xs text-muted-foreground mt-1">
            Documento gerado por <strong>FISCALIZ®</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
