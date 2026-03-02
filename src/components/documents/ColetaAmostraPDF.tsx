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

  const bd = '1px solid #000';

  const cellBase: React.CSSProperties = {
    border: bd,
    padding: '1px 3px',
    fontSize: '8pt',
    verticalAlign: 'top',
    lineHeight: '1.25',
  };

  const lbl: React.CSSProperties = {
    fontSize: '6pt',
    fontWeight: 'normal',
    color: '#000',
    display: 'block',
    lineHeight: '1.1',
  };

  const val: React.CSSProperties = {
    fontSize: '9pt',
    display: 'block',
    minHeight: '12px',
    lineHeight: '1.25',
  };

  const getTotalUnidades = (produto: any) => {
    return (produto.involucros || []).reduce((sum: number, inv: any) => sum + (parseInt(inv.unidades) || 0), 0);
  };

  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '9pt', color: '#000', padding: '8mm 10mm', maxWidth: '210mm', margin: '0 auto', background: '#fff' }}>
      {produtos.map((produto: any, prodIdx: number) => (
        <div key={prodIdx} style={{ pageBreakAfter: prodIdx < produtos.length - 1 ? 'always' : 'auto', marginBottom: prodIdx < produtos.length - 1 ? '40px' : '0' }}>

          {/* ========== CABEÇALHO ========== */}
          <table style={{ width: '100%', borderCollapse: 'collapse', border: bd }}>
            <tbody>
              <tr>
                {/* Brasão */}
                <td style={{ width: '55px', verticalAlign: 'middle', textAlign: 'center', padding: '4px', borderRight: bd }}>
                  <img src={BRASAO_GOIANIA_SVG} alt="Brasão" style={{ height: '48px', width: 'auto' }} />
                </td>
                {/* Textos centrais */}
                <td style={{ verticalAlign: 'middle', textAlign: 'center', padding: '2px 6px', borderRight: bd }}>
                  <div style={{ fontSize: '9pt', fontWeight: 'bold', lineHeight: '1.3' }}>PREFEITURA DE GOIÂNIA</div>
                  <div style={{ fontSize: '8pt', fontWeight: 'bold', lineHeight: '1.3' }}>SECRETARIA MUNICIPAL DE SAÚDE</div>
                  <div style={{ fontSize: '7pt', fontWeight: 'bold', lineHeight: '1.3' }}>DIRETORIA DE VIGILÂNCIA SANITÁRIA E AMBIENTAL</div>
                  <div style={{ fontSize: '5.5pt', color: '#333', marginTop: '1px', lineHeight: '1.2' }}>
                    Av Universitária Nº 644 Qd 107 Lot 03 Setor Leste Universitário– Goiânia -GO
                  </div>
                </td>
                {/* Número + vias */}
                <td style={{ width: '120px', verticalAlign: 'top', padding: '4px 6px' }}>
                  <div style={{ fontSize: '14pt', fontWeight: 'bold', textAlign: 'right', marginBottom: '4px', letterSpacing: '1px' }}>
                    {document.document_number || ''}
                  </div>
                  <div style={{ fontSize: '5pt', lineHeight: '1.5', textAlign: 'left' }}>
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
          <div style={{ fontSize: '8pt', margin: '3px 0 2px', borderBottom: bd, paddingBottom: '1px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '7pt' }}>COORDENAÇÃO:</span>{' '}
            <span style={{ fontSize: '9pt' }}>{document.profile?.division || 'CFA'}</span>
          </div>

          {/* TÍTULO */}
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', margin: '10px 0 8px', letterSpacing: '1px' }}>
            TERMO DE COLETA PARA ANÁLISE
          </div>

          {/* CATEGORIAS */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
            <tbody>
              <tr>
                {categorias.map((cat) => (
                  <td key={cat} style={{ textAlign: 'center', padding: '2px 3px', fontSize: '6.5pt', border: bd, fontWeight: 'bold' }}>
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
              <tr>
                <td colSpan={6} style={{ ...cellBase, fontWeight: 'bold', fontSize: '7.5pt', padding: '2px 3px', borderTop: bd }}>
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
                <td style={{ ...cellBase, width: '40px' }}>
                  <span style={lbl}>Nº</span>
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
                <td colSpan={12} style={{ ...cellBase, fontWeight: 'bold', fontSize: '7.5pt', padding: '2px 3px' }}>
                  2- IDENTIFICAÇÃO DO PRODUTO
                </td>
              </tr>
              {/* Nome */}
              <tr>
                <td colSpan={12} style={cellBase}>
                  <span style={lbl}>Nome:</span>
                  <span style={val}>{produto.nome || ''}</span>
                </td>
              </tr>
              {/* Marca | Natureza | Apresentação */}
              <tr>
                <td colSpan={4} style={cellBase}>
                  <span style={lbl}>Marca:</span>
                  <span style={val}>{produto.marca || ''}</span>
                </td>
                <td colSpan={4} style={cellBase}>
                  <span style={lbl}>Natureza:</span>
                  <span style={val}>{produto.natureza || ''}</span>
                </td>
                <td colSpan={4} style={cellBase}>
                  <span style={lbl}>Apresentação:</span>
                  <span style={val}>{produto.apresentacao || ''}</span>
                </td>
              </tr>
              {/* Data fabricação | Data validade | Lote | Nº Reg. | Volume/Peso | Temperatura */}
              <tr>
                <td colSpan={2} style={cellBase}>
                  <span style={lbl}>Data de fabricação:</span>
                  <span style={val}>{produto.dataFabricacao ? formatDateBR(produto.dataFabricacao) : ''}</span>
                </td>
                <td colSpan={2} style={cellBase}>
                  <span style={lbl}>Data de validade:</span>
                  <span style={val}>{produto.dataValidade ? formatDateBR(produto.dataValidade) : ''}</span>
                </td>
                <td colSpan={2} style={cellBase}>
                  <span style={lbl}>Lote:</span>
                  <span style={val}>{produto.lote || ''}</span>
                </td>
                <td colSpan={2} style={cellBase}>
                  <span style={lbl}>Nº Reg. no Min. da Saúde:</span>
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
                <td colSpan={7} style={cellBase}>
                  <span style={lbl}>Fabricante:</span>
                  <span style={val}>{produto.fabricante || ''}</span>
                </td>
                <td colSpan={5} style={cellBase}>
                  <span style={lbl}>CNPJ:</span>
                  <span style={val}>{produto.fabricanteCnpj || ''}</span>
                </td>
              </tr>
              {/* Endereço do fabricante | Qd | Lot. | Nº */}
              <tr>
                <td colSpan={7} style={cellBase}>
                  <span style={lbl}>Endereço:</span>
                  <span style={val}>{produto.fabricanteEndereco || ''}</span>
                </td>
                <td colSpan={2} style={cellBase}>
                  <span style={lbl}>Qd</span>
                  <span style={val}>{produto.fabricanteQd || ''}</span>
                </td>
                <td colSpan={1} style={cellBase}>
                  <span style={lbl}>Lot.</span>
                  <span style={val}>{produto.fabricanteLot || ''}</span>
                </td>
                <td colSpan={2} style={cellBase}>
                  <span style={lbl}>Nº:</span>
                  <span style={val}>{produto.fabricanteNumero || ''}</span>
                </td>
              </tr>
              {/* Localidade/setor | Município | UF */}
              <tr>
                <td colSpan={5} style={cellBase}>
                  <span style={lbl}>Localidade/ setor:</span>
                  <span style={val}>{produto.fabricanteLocalidade || ''}</span>
                </td>
                <td colSpan={5} style={cellBase}>
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
                  <span style={{ ...val, minHeight: '14px' }}>{produto.fundamentacaoLegal || ''}</span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Especificação da Notificação */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ ...cellBase, paddingBottom: '4px' }}>
                  <span style={lbl}>Especificação da Notificação:</span>
                  <div style={{ fontSize: '8.5pt', marginTop: '3px', lineHeight: '1.8' }}>
                    {'Ficam coletadas para fins de Análise '}
                    <span style={{ borderBottom: bd, fontWeight: 'bold', padding: '0 4px', display: 'inline-block', minWidth: '100px' }}>
                      {produto.tipoAnalise || ''}
                    </span>
                    {', '}
                    <span style={{ borderBottom: bd, padding: '0 4px', display: 'inline-block', minWidth: '30px', textAlign: 'center' }}>
                      {getTotalUnidades(produto) || ''}
                    </span>
                    {' unidade(s) do'}
                    <br />
                    {'produto acima identificado, distribuídos em '}
                    <span style={{ borderBottom: bd, fontWeight: 'bold', padding: '0 4px', display: 'inline-block', minWidth: '25px', textAlign: 'center' }}>
                      {produto.quantidadeInvolucros || (produto.involucros || []).filter((i: any) => i.lacreNumero || i.unidades).length || ''}
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
                  <td style={{ ...cellBase, fontWeight: 'bold', width: '90px', fontSize: '7pt', textAlign: 'center' }}>
                    INVÓLUCRO {inv.numero || String(invIdx + 1).padStart(2, '0')}
                  </td>
                  <td style={{ ...cellBase, width: '130px', fontSize: '7pt' }}>
                    <strong>LACRE Nº</strong>{' '}
                    <span>{inv.lacreNumero || '—'}</span>
                  </td>
                  <td style={{ ...cellBase, width: '35px', textAlign: 'center', fontSize: '7pt' }}>
                    {inv.unidades || '—'}
                  </td>
                  <td style={{ ...cellBase, width: '50px', fontSize: '7pt' }}>
                    Unidades
                  </td>
                  <td style={{ ...cellBase, fontSize: '7pt' }}>
                    <strong>DESTINO</strong>{' '}
                    {inv.destino || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Apenas para amostras com contra prova */}
          <div style={{ border: bd, borderTop: 'none', padding: '4px 5px', fontSize: '6.5pt', lineHeight: '1.5' }}>
            <strong style={{ fontSize: '6pt', textDecoration: 'underline' }}>APENAS PARA AMOSTRAS COM CONTRA PROVA</strong><br />
            {'Recebi o INVÓLUCRO Nº 03 contendo amostras do produto identificado para efeito de possível perícia de contra-prova, obrigando-me a mantê-la e conservá-la adequadamente, conforme o recomendado, na condição de fiel depositário.'}
          </div>

          {/* Data e Hora */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <tbody>
              <tr>
                <td style={{ fontSize: '9pt', verticalAlign: 'bottom' }}>
                  <strong>GOIÂNIA</strong>
                </td>
                <td style={{ fontSize: '9pt', textAlign: 'right', verticalAlign: 'bottom' }}>
                  Data:{' '}
                  <span style={{ borderBottom: bd, display: 'inline-block', minWidth: '100px', padding: '0 4px', textAlign: 'center' }}>
                    {documentDate ? formatDateBR(documentDate) : ''}
                  </span>
                </td>
                <td style={{ fontSize: '9pt', textAlign: 'right', verticalAlign: 'bottom', width: '130px' }}>
                  Hora:{' '}
                  <span style={{ borderBottom: bd, display: 'inline-block', minWidth: '55px', padding: '0 4px', textAlign: 'center' }}>
                    {documentTime || ''}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ========== ASSINATURAS ========== */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', border: bd }}>
            <tbody>
              {/* Linha 1: Autoridade Sanitária | Assinatura do notificado */}
              <tr>
                <td style={{ width: '50%', verticalAlign: 'bottom', padding: '3px 6px', borderRight: bd, borderBottom: bd }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '6pt', marginBottom: '2px' }}>Autoridade Sanitária:</div>
                    <div style={{ minHeight: '35px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      {document.profile?.signature_url && (
                        <img src={document.profile.signature_url} alt="Assinatura" style={{ height: '35px', maxWidth: '160px', objectFit: 'contain' }} />
                      )}
                    </div>
                    <div style={{ borderTop: bd, paddingTop: '2px', marginTop: '2px' }}>
                      <div style={{ fontSize: '8pt', fontWeight: 'bold' }}>{document.profile?.full_name || ''}</div>
                      {document.profile?.registration_number && (
                        <div style={{ fontSize: '5.5pt' }}>Auditor(a) Fiscal de Saúde Pública</div>
                      )}
                      {document.profile?.registration_number && (
                        <div style={{ fontSize: '5.5pt' }}>Matrícula {document.profile.registration_number}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ width: '50%', verticalAlign: 'bottom', padding: '3px 6px', borderBottom: bd }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '6pt', marginBottom: '2px' }}>Assinatura do notificado</div>
                    <div style={{ minHeight: '35px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      {contributorSignatureUrl && (
                        <img src={contributorSignatureUrl} alt="Assinatura" style={{ height: '35px', maxWidth: '160px', objectFit: 'contain' }} />
                      )}
                    </div>
                    <div style={{ borderTop: bd, paddingTop: '2px', marginTop: '2px' }}>
                      {prepostoName && <div style={{ fontSize: '8pt' }}>{prepostoName}</div>}
                      {prepostoCpf && <div style={{ fontSize: '5.5pt' }}>CPF: {prepostoCpf}</div>}
                      {!prepostoName && <div style={{ minHeight: '12px' }}></div>}
                    </div>
                  </div>
                </td>
              </tr>
              {/* Linha 2: Testemunhas */}
              <tr>
                <td style={{ padding: '3px 6px', borderRight: bd }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '6pt', marginBottom: '2px' }}>Assinatura da Testemunha:</div>
                    <div style={{ borderTop: bd, minHeight: '10px', marginTop: '25px' }}></div>
                  </div>
                </td>
                <td style={{ padding: '3px 6px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '6pt', marginBottom: '2px' }}>Assinatura da Testemunha:</div>
                    <div style={{ borderTop: bd, minHeight: '10px', marginTop: '25px' }}></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Observações (se houver) */}
          {produto.observacoes && (
            <div style={{ marginTop: '4px', fontSize: '6.5pt', fontStyle: 'italic' }}>
              <strong>Obs:</strong> {produto.observacoes}
            </div>
          )}

          {/* Rodapé */}
          <div style={{ marginTop: '4px', fontSize: '5pt', color: '#888' }}>
            COD. 04320-9
          </div>
        </div>
      ))}
    </div>
  );
}
