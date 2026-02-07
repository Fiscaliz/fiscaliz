import { supabase } from '@/integrations/supabase/client';

// Tipos de documento que não recebem numeração
const NON_NUMBERED_TYPES = ['relatorio_tecnico', 'relatorio_atividade'];

// Prefixos para cada tipo de documento (apenas para referência interna)
const DOCUMENT_TYPE_PREFIX: Record<string, string> = {
  termo_intimacao: 'TI',
  visita_fiscal: 'VF',
  auto_infracao: 'AI',
  certidao: 'CE',
  inutilizacao: 'INUT',
  apreensao: 'APR',
  interdicao: 'INT',
  advertencia: 'ADV',
  notificacao: 'NOT',
  coleta_amostra: 'COL',
  replica: 'REP',
};

/**
 * Gera o prefixo do fiscal baseado no nome e matrícula
 * Formato: 2 iniciais do nome + 3 primeiros números da matrícula
 * Exemplo: "JANINE FERNANDES" + "977950" => "JA977"
 */
export function generateFiscalPrefix(fullName: string, registrationNumber: string): string {
  // Pegar as 2 primeiras letras do primeiro nome (ou iniciais se houver mais nomes)
  const nameParts = fullName.trim().toUpperCase().split(/\s+/);
  let initials = '';
  
  if (nameParts.length >= 1 && nameParts[0].length >= 2) {
    // Usar as 2 primeiras letras do primeiro nome
    initials = nameParts[0].slice(0, 2);
  } else if (nameParts.length >= 2) {
    // Fallback: usar primeira letra de cada nome
    initials = nameParts.slice(0, 2).map(p => p[0]).join('');
  } else {
    initials = 'XX';
  }
  
  // Pegar os 3 primeiros dígitos da matrícula
  const cleanRegistration = registrationNumber.replace(/\D/g, '');
  const registrationDigits = cleanRegistration.slice(0, 3).padEnd(3, '0');
  
  return `${initials}${registrationDigits}`;
}

/**
 * Formata o número sequencial com zeros à esquerda (6 dígitos)
 */
export function formatSequentialNumber(sequenceNumber: number): string {
  return sequenceNumber.toString().padStart(6, '0');
}

/**
 * Gera o número completo do documento
 * Formato: [Prefixo Fiscal]-[Tipo Doc]-[Sequência]
 * Exemplo: JA977-TI-000001
 */
export function generateDocumentNumberFormat(
  fullName: string,
  registrationNumber: string,
  documentType: string,
  sequenceNumber: number
): string {
  const fiscalPrefix = generateFiscalPrefix(fullName, registrationNumber);
  const docPrefix = DOCUMENT_TYPE_PREFIX[documentType] || 'DOC';
  const sequence = formatSequentialNumber(sequenceNumber);
  
  return `${docPrefix}-${fiscalPrefix}-${sequence}`;
}

/**
 * Obtém o próximo número sequencial para um tipo de documento
 * @param documentType - Tipo do documento fiscal
 * @returns O número formatado (ex: JA977-TI-000001) ou null para tipos não numerados
 */
export async function getNextDocumentNumber(documentType: string): Promise<string | null> {
  // Tipos que não são numerados retornam null
  if (NON_NUMBERED_TYPES.includes(documentType)) {
    return null;
  }

  try {
    // Primeiro, buscar dados do perfil do usuário logado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, registration_number')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      throw new Error('Perfil do usuário não encontrado');
    }

    // Obter o próximo número sequencial
    const { data, error } = await supabase.rpc('get_next_document_number', {
      p_document_type: documentType,
    });

    if (error) {
      console.error('Error getting document number:', error);
      throw error;
    }

    // O RPC retorna algo como "TI-000001", precisamos extrair apenas o número
    const sequenceMatch = (data as string)?.match(/(\d+)$/);
    const sequenceNumber = sequenceMatch ? parseInt(sequenceMatch[1], 10) : 1;

    // Gerar o novo formato de numeração
    const docNumber = generateDocumentNumberFormat(
      profile.full_name,
      profile.registration_number || '000',
      documentType,
      sequenceNumber
    );

    return docNumber;
  } catch (error) {
    console.error('Failed to get document number:', error);
    throw error;
  }
}

/**
 * Verifica se um tipo de documento deve receber numeração
 * @param documentType - Tipo do documento fiscal
 * @returns true se o documento deve ser numerado
 */
export function isNumberedDocumentType(documentType: string): boolean {
  return !NON_NUMBERED_TYPES.includes(documentType);
}
