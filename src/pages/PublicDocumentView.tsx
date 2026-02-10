import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileText, AlertCircle, Building2, Calendar, Hash, User, MapPin, Download } from 'lucide-react';
import logoFiscaliz from '@/assets/logo-fiscaliz.png';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

const documentTypeLabels: Record<string, string> = {
  termo_intimacao: 'Termo de Intimação',
  visita_fiscal: 'Visita Fiscal',
  auto_infracao: 'Auto de Infração',
  advertencia: 'Advertência',
  inutilizacao: 'Inutilização',
  apreensao: 'Apreensão',
  interdicao: 'Interdição',
  relatorio_tecnico: 'Relatório Técnico',
  notificacao: 'Notificação',
  replica: 'Réplica',
  certidao: 'Certidão',
  coleta_amostra: 'Coleta de Amostra',
  relatorio_atividade: 'Relatório de Atividade',
};

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  sent: 'Enviado',
  archived: 'Concluído',
};

export default function PublicDocumentView() {
  const { id } = useParams<{ id: string }>();
  const [status, setStatus] = useState<'loading' | 'found' | 'error'>('loading');
  const [document, setDocument] = useState<any>(null);
  const [establishment, setEstablishment] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [pdfSignedUrl, setPdfSignedUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  useEffect(() => {
    if (!id) {
      setStatus('error');
      setErrorMessage('Link inválido. ID do documento ausente.');
      return;
    }

    const fetchDocument = async () => {
      const { data, error } = await supabase
        .from('fiscal_documents')
        .select('*, establishment:establishments(*)')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        setStatus('error');
        setErrorMessage('Documento não encontrado ou ainda não foi enviado.');
        return;
      }

      const est = Array.isArray(data.establishment) ? data.establishment[0] : data.establishment;
      setDocument(data);
      setEstablishment(est);
      setStatus('found');

      // Se tem pdf_url, gerar signed URL automaticamente
      if (data.pdf_url) {
        setLoadingPdf(true);
        const { data: signedData, error: signedError } = await supabase.storage
          .from('fiscal-photos')
          .createSignedUrl(data.pdf_url, 3600);

        if (signedData?.signedUrl) {
          setPdfSignedUrl(signedData.signedUrl);
        } else {
          console.error('Error creating signed URL for PDF:', signedError);
        }
        setLoadingPdf(false);
      }
    };

    fetchDocument();
  }, [id]);

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-6 text-white text-center">
          <img src={logoFiscaliz} alt="Fiscaliz" className="h-12 mx-auto mb-3 brightness-0 invert" />
          <p className="text-blue-200 text-xs tracking-wider uppercase">Documento Fiscal Digital</p>
        </div>

        <div className="p-6 space-y-5">
          {status === 'loading' && (
            <div className="text-center py-8 space-y-3">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-gray-500">Carregando documento...</p>
            </div>
          )}

          {status === 'found' && document && (
            <>
              {/* Document Type Badge */}
              <div className="text-center">
                <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 text-sm font-semibold px-4 py-2 rounded-full border border-blue-200">
                  <FileText className="h-4 w-4" />
                  {documentTypeLabels[document.document_type] || document.document_type}
                </span>
              </div>

              {/* PDF Download Button */}
              {pdfSignedUrl && (
                <div className="text-center">
                  <a href={pdfSignedUrl} target="_blank" rel="noopener noreferrer">
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white w-full" size="lg">
                      <Download className="h-5 w-5" />
                      Baixar Documento PDF
                    </Button>
                  </a>
                </div>
              )}

              {loadingPdf && (
                <div className="text-center py-2">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin mx-auto" />
                  <p className="text-xs text-gray-500 mt-1">Preparando PDF...</p>
                </div>
              )}

              {/* Document Info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                {document.document_number && (
                  <div className="flex items-center gap-3">
                    <Hash className="h-4 w-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Número</p>
                      <p className="text-sm font-semibold text-gray-800">{document.document_number}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Data da Ação</p>
                    <p className="text-sm text-gray-800">
                      {document.action_date ? formatDate(document.action_date) : formatDate(document.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Status</p>
                    <p className="text-sm text-gray-800">{statusLabels[document.status] || document.status}</p>
                  </div>
                </div>

                {document.deadline_date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-orange-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Prazo</p>
                      <p className="text-sm font-semibold text-orange-700">{formatDate(document.deadline_date)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Establishment Info */}
              {establishment && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Estabelecimento</p>
                  
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                    <p className="text-sm font-semibold text-gray-800">
                      {establishment.nome_fantasia || establishment.razao_social}
                    </p>
                  </div>

                  {establishment.cnpj && (
                    <div className="flex items-center gap-3">
                      <Hash className="h-4 w-4 text-gray-400 shrink-0" />
                      <p className="text-sm text-gray-600">CNPJ: {establishment.cnpj}</p>
                    </div>
                  )}

                  {establishment.endereco && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                      <p className="text-sm text-gray-600">{establishment.endereco}</p>
                    </div>
                  )}

                  {establishment.responsavel_nome && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-400 shrink-0" />
                      <p className="text-sm text-gray-600">Resp.: {establishment.responsavel_nome}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Legal note */}
              <div className="text-center border-t pt-4">
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Este documento foi gerado eletronicamente pelo sistema <strong>FISCALIZ®</strong> e possui validade legal conforme legislação vigente.
                </p>
                <p className="text-[10px] text-gray-400 mt-1 font-semibold">
                  Lei Municipal 8.741/08
                </p>
              </div>
            </>
          )}

          {status === 'error' && (
            <div className="text-center py-8 space-y-4">
              <div className="bg-red-50 rounded-full p-4 w-fit mx-auto">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Documento não disponível</h2>
                <p className="text-gray-500 mt-1 text-sm">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 text-center border-t">
          <p className="text-[10px] text-gray-400">Vigilância Sanitária de Goiânia</p>
        </div>
      </div>
    </div>
  );
}
