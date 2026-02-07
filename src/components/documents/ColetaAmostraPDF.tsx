import { BRASAO_GOIANIA_SVG } from '@/lib/logos';
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
    try { return format(new Date(d + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR }); }
    catch { return d; }
  };

  // Shared border style
  const bd = '1px solid #000';

  const cellBase: React.CSSProperties = {
    border: bd,
    padding: '1px 3px',
    fontSize: '9pt',
    verticalAlign: 'top',
    lineHeight: '1.3',
  };

  const lbl: React.CSSProperties = {
    fontSize: '6.5pt',
    fontWeight: 'normal',
    color: '#000',
    display: 'block',
    lineHeight: '1.2',
  };

  const val: React.CSSProperties = {
    fontSize: '10pt',
    display: 'block',
    minHeight: '13px',
    lineHeight: '1.3',
  };

  // Compute total unidades from invólucros
  const getTotalUnidades = (produto: any) => {
    return (produto.involucros || []).reduce((sum: number, inv: any) => sum + (parseInt(inv.unidades) || 0), 0);
  };

  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '10pt', color: '#000', padding: '10px 15px', maxWidth: '210mm', margin: '0 auto', background: '#fff' }}>
      {produtos.map((produto: any, prodIdx: number) => (
        <div key={prodIdx} style={{ pageBreakAfter: prodIdx < produtos.length - 1 ? 'always' : 'auto', marginBottom: prodIdx < produtos.length - 1 ? '40px' : '0' }}>

          {/* ========== CABEÇALHO ========== */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
            <colgroup>
              <col style={{ width: '60px' }} />
              <col />
              <col style={{ width: '130px' }} />
            </colgroup>
            <tbody>
              <tr>
                <td style={{ verticalAlign: 'middle', textAlign: 'center', padding: '0' }}>
                  <img src={BRASAO_GOIANIA_SVG} alt="Brasão" style={{ height: '52px', width: 'auto' }} />
                </td>
                <td style={{ verticalAlign: 'middle', textAlign: 'center', padding: '0 6px' }}>
                  <div style={{ fontSize: '10pt', fontWeight: 'bold', lineHeight: '1.3' }}>PREFEITURA DE GOIÂNIA</div>
                  <div style={{ fontSize: '8.5pt', fontWeight: 'bold', lineHeight: '1.3' }}>SECRETARIA MUNICIPAL DE SAÚDE</div>
                  <div style={{ fontSize: '7pt', fontWeight: 'bold', lineHeight: '1.3' }}>DIRETORIA DE VIGILÂNCIA SANITÁRIA E AMBIENTAL</div>
                  <div style={{ fontSize: '6pt', color: '#333', marginTop: '1px', lineHeight: '1.2' }}>Av Universitária Nº 644 Qd 107 Lot 03 Setor Leste Universitário - Goiânia -GO</div>
                </td>
                <td style={{ verticalAlign: 'top', textAlign: 'right', padding: '0' }}>
                  {/* Número do documento */}
                  <div style={{ border: bd, padding: '3px 6px', fontSize: '13pt', fontWeight: 'bold', textAlign: 'center', marginBottom: '3px' }}>
                    {document.document_number || ''}
                  </div>
                  {/* Vias */}
                  <div style={{ fontSize: '5.5pt', lineHeight: '1.5', textAlign: 'left', paddingLeft: '2px' }}>
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
          <div style={{ fontSize: '9pt', marginBottom: '3px' }}>
            <strong>COORDENAÇÃO:</strong>{' '}
            <span style={{ borderBottom: bd, display: 'inline-block', minWidth: '180px', paddingBottom: '1px' }}>
              {document.profile?.division || 'CFA'}
            </span>
          </div>

          {/* TÍTULO */}
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11pt', margin: '8px 0 6px', letterSpacing: '0.5px' }}>
            TERMO DE COLETA PARA ANÁLISE
          </div>

          {/* CATEGORIAS - Checkboxes em linha */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2px' }}>
            <tbody>
              <tr>
                {categorias.map((cat) => (
                  <td key={cat} style={{ textAlign: 'center', padding: '2px 4px', fontSize: '7pt', border: bd }}>
                    <span style={{
                      display: 'inline-block', width: '10px', height: '10px', border: bd,
                      textAlign: 'center', lineHeight: '10px', fontSize: '8pt', fontWeight: 'bold',
                      verticalAlign: 'middle', marginRight: '2px',
                      backgroundColor: categoriaSelecionada === cat ? '#000' : '#fff',
                      color: categoriaSelecionada === cat ? '#fff' : '#000',
                    }}>
                      {categoriaSelecionada === cat ? 'X' : '\u00A0'}
                    </span>
                    {cat}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          {/* ========== 1- LOCAL DA COLETA ========== */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {/* Cabeçalho da seção */}
              <tr>
                <td colSpan={6} style={{ ...cellBase, fontWeight: 'bold', fontSize: '8pt', padding: '2px 4px', borderBottom: bd }}>
                  1- LOCAL DA COLETA
                </td>
              </tr>
              {/* Razão social */}
              <tr>
                <td colSpan={6} style={cellBase}>
                  <span style={lbl}>Razão social:</span>
                  <span style={val}>{est?.razao_social || ''}</span>
                </td>
              </tr>
              {/* Nome comercial | Atividade | Nº */}
              <tr>
                <td colSpan={3} style={cellBase}>
                  <span style={lbl}>Nome comercial:</span>
                  <span style={val}>{est?.nome_fantasia || ''}</span>
                </td>
                <td colSpan={2} style={cellBase}>
                  <span style={lbl}>Atividade:</span>
                  <span style={val}>{(est as any)?.cnae_principal || ''}</span>
                </td>
                <td style={{ ...cellBase, width: '50px' }}>
                  <span style={lbl}>Nº:</span>
                  <span style={val}></span>
                </td>
              </tr>
              {/* Endereço */}
              <tr>
                <td colSpan={6} style={cellBase}>
                  <span style={lbl}>Endereço:</span>
                  <span style={val}>{est?.endereco || ''}</span>
                </td>
              </tr>
              {/* Localidade / Setor */}
              <tr>
                <td colSpan={6} style={cellBase}>
                  <span style={lbl}>Localidade / Setor:</span>
                  <span style={val}>{est?.bairro || ''}</span>
                </td>
              </tr>
              {/* CNPJ | Fone | Fax */}
              <tr>
                <td colSpan={3} style={cellBase}>
                  <span style={lbl}>CNPJ:</span>
                  <span style={val}>{est?.cnpj || ''}</span>
                </td>
                <td colSpan={2} style={cellBase}>
                  <span style={lbl}>Fone:</span>
                  <span style={val}>{est?.responsavel_telefone || ''}</span>
                </td>
                <td style={cellBase}>
                  <span style={lbl}>Fax:</span>
                  <span style={val}></span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ========== 2- IDENTIFICAÇÃO DO PRODUTO ========== */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td colSpan={8} style={{ ...cellBase, fontWeight: 'bold', fontSize: '8pt', padding: '2px 4px' }}>
                  2- IDENTIFICAÇÃO DO PRODUTO
                </td>
              </tr>
              {/* Nome */}
              <tr>
                <td colSpan={8} style={cellBase}>
                  <span style={lbl}>Nome:</span>
                  <span style={val}>{produto.nome || ''}</span>
                </td>
              </tr>
              {/* Marca | Natureza | Apresentação */}
              <tr>
                <td colSpan={3} style={cellBase}>
                  <span style={lbl}>Marca:</span>
                  <span style={val}>{produto.marca || ''}</span>
                </td>
                <td colSpan={3} style={cellBase}>
                  <span style={lbl}>Natureza:</span>
                  <span style={val}>{produto.natureza || ''}</span>
                </td>
                <td colSpan={2} style={cellBase}>
                  <span style={lbl}>Apresentação:</span>
                  <span style={val}>{produto.apresentacao || ''}</span>
                </td>
              </tr>
              {/* Datas | Lote | NºReg | Volume/Peso | Temperatura */}
              <tr>
                <td style={cellBase}>
                  <span style={lbl}>Data de fabricação:</span>
                  <span style={val}>{produto.dataFabricacao ? formatDateBR(produto.dataFabricacao) : ''}</span>
                </td>
                <td style={cellBase}>
                  <span style={lbl}>Data de validade:</span>
                  <span style={val}>{produto.dataValidade ? formatDateBR(produto.dataValidade) : ''}</span>
                </td>
                <td style={cellBase}>
                  <span style={lbl}>Lote:</span>
                  <span style={val}>{produto.lote || ''}</span>
                </td>
                <td style={cellBase}>
                  <span style={lbl}>Nº Reg.:</span>
                  <span style={val}>{produto.numeroRegistro || ''}</span>
                </td>
                <td colSpan={2} style={cellBase}>
                  <span style={lbl}>Volume/Peso:</span>
                  <span style={val}>{produto.volumePeso || ''}</span>
                </td>
                <td colSpan={2} style={cellBase}>
                  <span style={lbl}>Temperatura:</span>
                  <span style={val}>{produto.temperatura || ''}</span>
                </td>
              </tr>

              {/* Fabricante | CNPJ */}
              <tr>
                <td colSpan={5} style={cellBase}>
                  <span style={lbl}>Fabricante:</span>
                  <span style={val}>{produto.fabricante || ''}</span>
                </td>
                <td colSpan={3} style={cellBase}>
                  <span style={lbl}>CNPJ:</span>
                  <span style={val}>{produto.fabricanteCnpj || ''}</span>
                </td>
              </tr>
              {/* Endereço fabricante */}
              <tr>
                <td colSpan={8} style={cellBase}>
                  <span style={lbl}>Endereço:</span>
                  <span style={val}>{produto.fabricanteEndereco || ''}</span>
                </td>
              </tr>
              {/* Localidade/setor | Município | UF */}
              <tr>
                <td colSpan={3} style={cellBase}>
                  <span style={lbl}>Localidade/ setor:</span>
                  <span style={val}>{produto.fabricanteLocalidade || ''}</span>
                </td>
                <td colSpan={3} style={cellBase}>
                  <span style={lbl}>Município:</span>
                  <span style={val}>{produto.fabricanteMunicipio || ''}</span>
                </td>
                <td colSpan={2} style={cellBase}>
                  <span style={lbl}>UF:</span>
                  <span style={val}>{produto.fabricanteUf || ''}</span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Fundamentação legal */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={cellBase}>
                  <span style={lbl}>Fundamentação legal:</span>
                  <span style={{ ...val, minHeight: '16px' }}>{produto.fundamentacaoLegal || ''}</span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Especificação da Notificação */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ ...cellBase, paddingBottom: '6px' }}>
                  <span style={lbl}>Especificação da Notificação:</span>
                  <div style={{ fontSize: '9pt', marginTop: '3px', lineHeight: '1.7' }}>
                    {'Ficam coletadas para fins de Análise '}
                    <span style={{ borderBottom: bd, fontWeight: 'bold', padding: '0 6px', display: 'inline-block', minWidth: '120px' }}>
                      {produto.tipoAnalise || ''}
                    </span>
                    {' '}
                    <span style={{ borderBottom: bd, padding: '0 6px', display: 'inline-block', minWidth: '40px', textAlign: 'center' }}>
                      {getTotalUnidades(produto) || ''}
                    </span>
                    {' unidade(s) do'}
                    <br />
                    {'produto acima identificado, distribuídos em '}
                    <span style={{ borderBottom: bd, fontWeight: 'bold', padding: '0 6px', display: 'inline-block', minWidth: '30px', textAlign: 'center' }}>
                      {produto.quantidadeInvolucros || ''}
                    </span>
                    {' invólucros, assim discriminados:'}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Tabela de Invólucros */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {(produto.involucros || []).map((inv: any, invIdx: number) => (
                <tr key={invIdx}>
                  <td style={{ ...cellBase, fontWeight: 'bold', width: '95px', fontSize: '7.5pt', textAlign: 'center' }}>
                    INVÓLUCRO {inv.numero || String(invIdx + 1).padStart(2, '0')}
                  </td>
                  <td style={{ ...cellBase, width: '120px', fontSize: '7.5pt' }}>
                    <strong>LACRE Nº</strong>{' '}
                    <span>{inv.lacreNumero || '—'}</span>
                  </td>
                  <td style={{ ...cellBase, width: '50px', textAlign: 'center', fontSize: '7.5pt' }}>
                    {inv.unidades || '—'}
                  </td>
                  <td style={{ ...cellBase, width: '55px', fontSize: '7.5pt' }}>
                    Unidades
                  </td>
                  <td style={{ ...cellBase, fontSize: '7.5pt' }}>
                    <strong>DESTINO</strong>{' '}
                    {inv.destino || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Apenas para amostras com contra prova */}
          <div style={{ border: bd, borderTop: 'none', padding: '5px 6px', fontSize: '7pt', lineHeight: '1.5' }}>
            <strong>APENAS PARA AMOSTRAS COM CONTRA PROVA</strong><br />
            {'Recebi o INVÓLUCRO Nº 03 contendo amostras do produto identificado para efeito de possível perícia de contra-prova, obrigando-me a mantê-la e conservá-la adequadamente, conforme o recomendado, na condição de fiel depositário.'}
          </div>

          {/* Data e Hora */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <tbody>
              <tr>
                <td style={{ fontSize: '10pt', verticalAlign: 'bottom' }}>
                  <strong>GOIÂNIA</strong>
                </td>
                <td style={{ fontSize: '10pt', textAlign: 'right', verticalAlign: 'bottom' }}>
                  Data:{' '}
                  <span style={{ borderBottom: bd, display: 'inline-block', minWidth: '110px', padding: '0 4px', textAlign: 'center' }}>
                    {documentDate ? formatDateBR(documentDate) : ''}
                  </span>
                </td>
                <td style={{ fontSize: '10pt', textAlign: 'right', verticalAlign: 'bottom', width: '140px' }}>
                  Hora:{' '}
                  <span style={{ borderBottom: bd, display: 'inline-block', minWidth: '60px', padding: '0 4px', textAlign: 'center' }}>
                    {documentTime || ''}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ========== ASSINATURAS ========== */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
            <tbody>
              {/* Linha 1: Autoridade Sanitária | Assinatura do notificado */}
              <tr>
                <td style={{ width: '50%', verticalAlign: 'bottom', padding: '0 8px 0 0' }}>
                  <div style={{ textAlign: 'center' }}>
                    {/* Rubrica/assinatura do fiscal */}
                    <div style={{ minHeight: '40px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      {document.profile?.signature_url && (
                        <img src={document.profile.signature_url} alt="Assinatura" style={{ height: '40px', maxWidth: '170px', objectFit: 'contain' }} />
                      )}
                    </div>
                    <div style={{ fontSize: '6.5pt', fontStyle: 'italic', marginBottom: '2px' }}>Autoridade Sanitária:</div>
                    <div style={{ borderTop: bd, paddingTop: '2px' }}>
                      <div style={{ fontSize: '9pt', fontWeight: 'bold' }}>{document.profile?.full_name || ''}</div>
                      {document.profile?.registration_number && (
                        <div style={{ fontSize: '6.5pt' }}>Auditor{document.profile?.full_name?.match(/^[A-Z]/) ? 'a' : ''} Fiscal de Saúde Pública</div>
                      )}
                      {document.profile?.registration_number && (
                        <div style={{ fontSize: '6.5pt' }}>Matrícula {document.profile.registration_number}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ width: '50%', verticalAlign: 'bottom', padding: '0 0 0 8px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ minHeight: '40px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      {contributorSignatureUrl && (
                        <img src={contributorSignatureUrl} alt="Assinatura" style={{ height: '40px', maxWidth: '170px', objectFit: 'contain' }} />
                      )}
                    </div>
                    <div style={{ fontSize: '6.5pt', fontStyle: 'italic', marginBottom: '2px' }}>Assinatura do notificado</div>
                    <div style={{ borderTop: bd, paddingTop: '2px' }}>
                      {prepostoName && <div style={{ fontSize: '9pt' }}>{prepostoName}</div>}
                      {prepostoCpf && <div style={{ fontSize: '6.5pt' }}>CPF: {prepostoCpf}</div>}
                      {!prepostoName && <div style={{ minHeight: '14px' }}></div>}
                    </div>
                  </div>
                </td>
              </tr>
              {/* Linha 2: Testemunhas */}
              <tr>
                <td style={{ paddingTop: '18px', paddingRight: '8px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '6.5pt', fontStyle: 'italic', marginBottom: '2px' }}>Assinatura da Testemunha:</div>
                    <div style={{ borderTop: bd, minHeight: '10px' }}></div>
                  </div>
                </td>
                <td style={{ paddingTop: '18px', paddingLeft: '8px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '6.5pt', fontStyle: 'italic', marginBottom: '2px' }}>Assinatura da Testemunha:</div>
                    <div style={{ borderTop: bd, minHeight: '10px' }}></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Observações (se houver) */}
          {produto.observacoes && (
            <div style={{ marginTop: '6px', fontSize: '7pt', fontStyle: 'italic' }}>
              <strong>Obs:</strong> {produto.observacoes}
            </div>
          )}

          {/* Rodapé - código do formulário */}
          <div style={{ marginTop: '6px', fontSize: '5.5pt', color: '#888' }}>
            COD. 04320-9 — Gerado por FISCALIZ®
          </div>
        </div>
      ))}
    </div>
  );
}
