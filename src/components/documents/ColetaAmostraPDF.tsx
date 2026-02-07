import { BRASAO_GOIANIA_SVG, SUS_LOGO_SVG } from '@/lib/logos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ColetaAmostraPDFProps {
  document: {
    id: string;
    document_type: string;
    document_number?: string;
    content: any;
    attachments?: any[] | null;
    establishment?: {
      razao_social: string;
      nome_fantasia?: string;
      cnpj: string;
      endereco: string;
      bairro?: string;
      responsavel_nome?: string;
      responsavel_telefone?: string;
    };
    profile?: {
      full_name: string;
      registration_number?: string;
      division?: string;
      signature_url?: string;
    };
    created_at: string;
  };
  documentDate: string;
  documentTime: string;
  contributorSignatureUrl: string | null;
  prepostoName: string;
  prepostoCpf: string;
}

const categorias = ['ALIMENTO', 'MEDICAMENTO', 'CORRELATO', 'QUÍMICO', 'SANEANTE DOMISSANITÁRIO', 'OUTROS'];

export function ColetaAmostraPDF({
  document,
  documentDate,
  documentTime,
  contributorSignatureUrl,
  prepostoName,
  prepostoCpf,
}: ColetaAmostraPDFProps) {
  const coletaData = document.content?.coleta_amostra_data;
  const produtos = coletaData?.produtos || [];
  const categoriaSelecionada = coletaData?.categoriaProduto || '';
  const est = document.establishment;

  const formatDateBR = (d: string) => {
    try {
      return format(new Date(d + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return d;
    }
  };

  const formatDateFull = (d: string) => {
    try {
      return format(new Date(d), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return d;
    }
  };

  // Cell style helpers
  const cellStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    border: '1px solid #333',
    padding: '2px 4px',
    fontSize: '9pt',
    verticalAlign: 'top',
    ...extra,
  });

  const labelStyle: React.CSSProperties = {
    fontSize: '7pt',
    fontWeight: 'bold',
    color: '#333',
    display: 'block',
    marginBottom: '1px',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '10pt',
    minHeight: '14px',
    display: 'block',
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', color: '#000', padding: '15px 20px', maxWidth: '210mm', margin: '0 auto', background: '#fff' }}>
      {produtos.map((produto: any, prodIdx: number) => (
        <div key={prodIdx} style={{ pageBreakAfter: prodIdx < produtos.length - 1 ? 'always' : 'auto', marginBottom: prodIdx < produtos.length - 1 ? '40px' : '0' }}>
          {/* ===== CABEÇALHO ===== */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
            <tbody>
              <tr>
                <td style={{ width: '70px', verticalAlign: 'middle', textAlign: 'center' }}>
                  <img src={BRASAO_GOIANIA_SVG} alt="Brasão" style={{ height: '55px', width: 'auto' }} />
                </td>
                <td style={{ verticalAlign: 'middle', textAlign: 'center', padding: '0 8px' }}>
                  <div style={{ fontSize: '10pt', fontWeight: 'bold' }}>PREFEITURA DE GOIÂNIA</div>
                  <div style={{ fontSize: '9pt', fontWeight: 'bold' }}>SECRETARIA MUNICIPAL DE SAÚDE</div>
                  <div style={{ fontSize: '7.5pt', fontWeight: 600 }}>DIRETORIA DE VIGILÂNCIA SANITÁRIA E AMBIENTAL</div>
                  <div style={{ fontSize: '6.5pt', color: '#555', marginTop: '2px' }}>Av Universitária Nº 644 Qd 107 Lot 03 Setor Leste Universitário - Goiânia -GO</div>
                </td>
                <td style={{ width: '110px', verticalAlign: 'top', textAlign: 'right', padding: '0' }}>
                  {document.document_number && (
                    <div style={{ border: '1px solid #333', padding: '4px 8px', fontSize: '14pt', fontWeight: 'bold', textAlign: 'center', marginBottom: '4px' }}>
                      {document.document_number}
                    </div>
                  )}
                  <div style={{ fontSize: '6pt', lineHeight: '1.4', textAlign: 'left' }}>
                    <div>1ª Via <strong>LABORATÓRIO</strong></div>
                    <div>2ª Via <strong>PONTO DE COLETA</strong></div>
                    <div>3ª Via <strong>FISCAL</strong></div>
                    <div>4ª Via <strong>CADASTRO</strong></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* COORDENAÇÃO */}
          <div style={{ marginBottom: '6px', fontSize: '9pt' }}>
            <strong>COORDENAÇÃO:</strong>{' '}
            <span style={{ borderBottom: '1px solid #333', paddingBottom: '1px', minWidth: '200px', display: 'inline-block' }}>
              {document.profile?.division || 'CFA'}
            </span>
          </div>

          {/* TÍTULO */}
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', margin: '10px 0 8px', letterSpacing: '1px' }}>
            TERMO DE COLETA PARA ANÁLISE
          </div>

          {/* CATEGORIAS - Checkboxes */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {categorias.map((cat) => (
              <label key={cat} style={{ fontSize: '8pt', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <span style={{ 
                  display: 'inline-block', width: '12px', height: '12px', border: '1px solid #333', 
                  textAlign: 'center', lineHeight: '12px', fontSize: '9pt', fontWeight: 'bold',
                  backgroundColor: categoriaSelecionada === cat ? '#000' : '#fff',
                  color: categoriaSelecionada === cat ? '#fff' : '#000',
                }}>
                  {categoriaSelecionada === cat ? 'X' : ''}
                </span>
                {cat}
              </label>
            ))}
          </div>

          {/* ===== 1- LOCAL DA COLETA ===== */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
            <tbody>
              <tr>
                <td colSpan={4} style={{ ...cellStyle({ fontWeight: 'bold', fontSize: '8pt', backgroundColor: '#f0f0f0', padding: '3px 4px' }) }}>
                  1- LOCAL DA COLETA
                </td>
              </tr>
              <tr>
                <td colSpan={4} style={cellStyle()}>
                  <span style={labelStyle}>Razão social:</span>
                  <span style={valueStyle}>{est?.razao_social || ''}</span>
                </td>
              </tr>
              <tr>
                <td colSpan={3} style={cellStyle()}>
                  <span style={labelStyle}>Nome comercial:</span>
                  <span style={valueStyle}>{est?.nome_fantasia || ''}</span>
                </td>
                <td style={cellStyle({ width: '120px' })}>
                  <span style={labelStyle}>Atividade:</span>
                  <span style={valueStyle}>{(est as any)?.cnae_principal || ''}</span>
                </td>
              </tr>
              <tr>
                <td colSpan={3} style={cellStyle()}>
                  <span style={labelStyle}>Endereço:</span>
                  <span style={valueStyle}>{est?.endereco || ''}{est?.bairro ? ` - ${est.bairro}` : ''}</span>
                </td>
                <td style={cellStyle()}>
                  <span style={labelStyle}>Nº:</span>
                  <span style={valueStyle}></span>
                </td>
              </tr>
              <tr>
                <td colSpan={4} style={cellStyle()}>
                  <span style={labelStyle}>Localidade / Setor:</span>
                  <span style={valueStyle}>{est?.bairro || ''}</span>
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={cellStyle()}>
                  <span style={labelStyle}>CNPJ:</span>
                  <span style={valueStyle}>{est?.cnpj || ''}</span>
                </td>
                <td style={cellStyle()}>
                  <span style={labelStyle}>Fone:</span>
                  <span style={valueStyle}>{est?.responsavel_telefone || ''}</span>
                </td>
                <td style={cellStyle()}>
                  <span style={labelStyle}>Fax:</span>
                  <span style={valueStyle}></span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ===== 2- IDENTIFICAÇÃO DO PRODUTO ===== */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
            <tbody>
              <tr>
                <td colSpan={6} style={{ ...cellStyle({ fontWeight: 'bold', fontSize: '8pt', backgroundColor: '#f0f0f0', padding: '3px 4px' }) }}>
                  2- IDENTIFICAÇÃO DO PRODUTO
                </td>
              </tr>
              <tr>
                <td colSpan={6} style={cellStyle()}>
                  <span style={labelStyle}>Nome:</span>
                  <span style={valueStyle}>{produto.nome || ''}</span>
                </td>
              </tr>
              <tr>
                <td colSpan={3} style={cellStyle()}>
                  <span style={labelStyle}>Marca:</span>
                  <span style={valueStyle}>{produto.marca || ''}</span>
                </td>
                <td colSpan={2} style={cellStyle()}>
                  <span style={labelStyle}>Natureza:</span>
                  <span style={valueStyle}>{produto.natureza || ''}</span>
                </td>
                <td style={cellStyle()}>
                  <span style={labelStyle}>Apresentação:</span>
                  <span style={valueStyle}>{produto.apresentacao || ''}</span>
                </td>
              </tr>
              <tr>
                <td style={cellStyle()}>
                  <span style={labelStyle}>Data de fabricação:</span>
                  <span style={valueStyle}>{produto.dataFabricacao ? formatDateBR(produto.dataFabricacao) : ''}</span>
                </td>
                <td style={cellStyle()}>
                  <span style={labelStyle}>Data de validade:</span>
                  <span style={valueStyle}>{produto.dataValidade ? formatDateBR(produto.dataValidade) : ''}</span>
                </td>
                <td style={cellStyle()}>
                  <span style={labelStyle}>Lote:</span>
                  <span style={valueStyle}>{produto.lote || ''}</span>
                </td>
                <td style={cellStyle()}>
                  <span style={labelStyle}>Nº Reg.:</span>
                  <span style={valueStyle}>{produto.numeroRegistro || ''}</span>
                </td>
                <td style={cellStyle()}>
                  <span style={labelStyle}>Volume/Peso:</span>
                  <span style={valueStyle}>{produto.volumePeso || ''}</span>
                </td>
                <td style={cellStyle()}>
                  <span style={labelStyle}>Temperatura:</span>
                  <span style={valueStyle}>{produto.temperatura || ''}</span>
                </td>
              </tr>

              {/* Fabricante */}
              <tr>
                <td colSpan={4} style={cellStyle()}>
                  <span style={labelStyle}>Fabricante:</span>
                  <span style={valueStyle}>{produto.fabricante || ''}</span>
                </td>
                <td colSpan={2} style={cellStyle()}>
                  <span style={labelStyle}>CNPJ:</span>
                  <span style={valueStyle}>{produto.fabricanteCnpj || ''}</span>
                </td>
              </tr>
              <tr>
                <td colSpan={6} style={cellStyle()}>
                  <span style={labelStyle}>Endereço:</span>
                  <span style={valueStyle}>{produto.fabricanteEndereco || ''}</span>
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={cellStyle()}>
                  <span style={labelStyle}>Localidade/ setor:</span>
                  <span style={valueStyle}>{produto.fabricanteLocalidade || ''}</span>
                </td>
                <td colSpan={2} style={cellStyle()}>
                  <span style={labelStyle}>Município:</span>
                  <span style={valueStyle}>{produto.fabricanteMunicipio || ''}</span>
                </td>
                <td colSpan={2} style={cellStyle()}>
                  <span style={labelStyle}>UF:</span>
                  <span style={valueStyle}>{produto.fabricanteUf || ''}</span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Fundamentação legal */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
            <tbody>
              <tr>
                <td style={cellStyle()}>
                  <span style={labelStyle}>Fundamentação legal:</span>
                  <span style={valueStyle}>{produto.fundamentacaoLegal || ''}</span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Especificação da Notificação */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
            <tbody>
              <tr>
                <td style={cellStyle()}>
                  <span style={labelStyle}>Especificação da Notificação:</span>
                  <div style={{ fontSize: '9pt', marginTop: '4px', lineHeight: '1.6' }}>
                    Ficam coletadas para fins de Análise <strong style={{ borderBottom: '1px solid #333', padding: '0 8px' }}>{produto.tipoAnalise || '_______________'}</strong>{' '}
                    _____________ unidade(s) do produto acima identificado, distribuídos em{' '}
                    <strong style={{ borderBottom: '1px solid #333', padding: '0 8px' }}>{produto.quantidadeInvolucros || '___'}</strong>{' '}
                    invólucros, assim discriminados:
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Tabela de Invólucros */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
            <tbody>
              {(produto.involucros || []).map((inv: any, invIdx: number) => (
                <tr key={invIdx}>
                  <td style={{ ...cellStyle({ fontWeight: 'bold', width: '100px', fontSize: '8pt' }) }}>
                    INVÓLUCRO {inv.numero || String(invIdx + 1).padStart(2, '0')}
                  </td>
                  <td style={{ ...cellStyle({ width: '130px', fontSize: '8pt' }) }}>
                    <strong>LACRE Nº</strong> {inv.lacreNumero || '—'}
                  </td>
                  <td style={{ ...cellStyle({ width: '70px', textAlign: 'center', fontSize: '8pt' }) }}>
                    {inv.unidades || '—'}
                  </td>
                  <td style={{ ...cellStyle({ fontSize: '8pt' }) }}>
                    Unidades
                  </td>
                  <td style={{ ...cellStyle({ fontSize: '8pt' }) }}>
                    <strong>DESTINO</strong>{' '}
                    {inv.destino || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Apenas para amostras com contra prova */}
          <div style={{ border: '1px solid #333', borderTop: 'none', padding: '6px 8px', fontSize: '8pt', lineHeight: '1.5' }}>
            <strong>APENAS PARA AMOSTRAS COM CONTRA PROVA</strong><br />
            Recebi o INVÓLUCRO Nº 03 contendo amostras do produto identificado para efeito de possível perícia de contra-prova, obrigando-me a mantê-la e conservá-la adequadamente, conforme o recomendado, na condição de fiel depositário.
          </div>

          {/* Data e Hora */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '12px 0 6px', gap: '30px', fontSize: '10pt' }}>
            <div>
              <strong>GOIÂNIA</strong>
            </div>
            <div>
              <span>Data: </span>
              <span style={{ borderBottom: '1px solid #333', padding: '0 4px', minWidth: '100px', display: 'inline-block' }}>
                {documentDate ? formatDateBR(documentDate) : '____/____/________'}
              </span>
            </div>
            <div>
              <span>Hora: </span>
              <span style={{ borderBottom: '1px solid #333', padding: '0 4px', minWidth: '60px', display: 'inline-block' }}>
                {documentTime || '____:____'}
              </span>
            </div>
          </div>

          {/* Assinaturas - 2x2 grid */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <tbody>
              <tr>
                {/* Autoridade Sanitária */}
                <td style={{ width: '50%', verticalAlign: 'bottom', padding: '0 10px 0 0' }}>
                  <div style={{ textAlign: 'center' }}>
                    {document.profile?.signature_url && (
                      <img src={document.profile.signature_url} alt="Assinatura" style={{ height: '45px', maxWidth: '180px', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
                    )}
                    <div style={{ borderTop: '1px solid #333', marginTop: '4px', paddingTop: '4px' }}>
                      <div style={{ fontSize: '7pt', fontWeight: 'bold' }}>Autoridade Sanitária:</div>
                      <div style={{ fontSize: '9pt', fontWeight: 'bold' }}>{document.profile?.full_name || ''}</div>
                      {document.profile?.registration_number && (
                        <div style={{ fontSize: '7pt' }}>Auditor Fiscal de Saúde Pública - Matrícula {document.profile.registration_number}</div>
                      )}
                    </div>
                  </div>
                </td>
                {/* Assinatura do notificado */}
                <td style={{ width: '50%', verticalAlign: 'bottom', padding: '0 0 0 10px' }}>
                  <div style={{ textAlign: 'center' }}>
                    {contributorSignatureUrl && (
                      <img src={contributorSignatureUrl} alt="Assinatura do notificado" style={{ height: '45px', maxWidth: '180px', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
                    )}
                    <div style={{ borderTop: '1px solid #333', marginTop: '4px', paddingTop: '4px' }}>
                      <div style={{ fontSize: '7pt', fontWeight: 'bold' }}>Assinatura do notificado</div>
                      {prepostoName && <div style={{ fontSize: '9pt' }}>{prepostoName}</div>}
                      {prepostoCpf && <div style={{ fontSize: '7pt' }}>CPF: {prepostoCpf}</div>}
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ paddingTop: '20px', paddingRight: '10px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1px solid #333', paddingTop: '4px' }}>
                      <div style={{ fontSize: '7pt', fontWeight: 'bold' }}>Assinatura da Testemunha:</div>
                    </div>
                  </div>
                </td>
                <td style={{ paddingTop: '20px', paddingLeft: '10px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1px solid #333', paddingTop: '4px' }}>
                      <div style={{ fontSize: '7pt', fontWeight: 'bold' }}>Assinatura da Testemunha:</div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Observações do produto (se houver) */}
          {produto.observacoes && (
            <div style={{ marginTop: '10px', fontSize: '8pt', fontStyle: 'italic', color: '#555' }}>
              <strong>Obs:</strong> {produto.observacoes}
            </div>
          )}

          {/* Código do formulário */}
          <div style={{ marginTop: '8px', fontSize: '6pt', color: '#999' }}>
            COD. 04320-9 — Gerado por FISCALIZ®
          </div>
        </div>
      ))}
    </div>
  );
}
