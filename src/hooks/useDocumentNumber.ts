import { supabase } from '@/integrations/supabase/client';

// Tipos de documento que não recebem numeração
const NON_NUMBERED_TYPES = ['relatorio_tecnico', 'relatorio_atividade'];

/**
 * Obtém o próximo número sequencial para um tipo de documento
 * @param documentType - Tipo do documento fiscal
 * @returns O número formatado (ex: TI-000001) ou null para tipos não numerados
 */
export async function getNextDocumentNumber(documentType: string): Promise<string | null> {
  // Tipos que não são numerados retornam null
  if (NON_NUMBERED_TYPES.includes(documentType)) {
    return null;
  }

  try {
    const { data, error } = await supabase.rpc('get_next_document_number', {
      p_document_type: documentType,
    });

    if (error) {
      console.error('Error getting document number:', error);
      throw error;
    }

    return data as string | null;
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
