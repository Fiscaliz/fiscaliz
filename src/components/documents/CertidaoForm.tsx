import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';

interface CertidaoFormProps {
  value: {
    selectedOptions: string[];
    observations: Record<string, string>;
    otherText: string;
  };
  onChange: (data: CertidaoFormProps['value']) => void;
  readOnly?: boolean;
}

const certidaoOptions = [
  { id: 'endereco_incorreto', label: 'O endereço estava incorreto/incompleto/não localizado' },
  { id: 'estabelecimento_fechado', label: 'O estabelecimento estava fechado' },
  { id: 'encerrou_atividades', label: 'O estabelecimento encerrou suas atividades no referido endereço' },
  { id: 'denuncia_improcedente', label: 'A denúncia não procede', hasInput: true, inputLabel: 'Denúncia nº' },
  { id: 'problema_resolvido', label: 'O problema já havia sido resolvido' },
  { id: 'alvara_liberado', label: 'Foi liberado o Alvará de Autorização Sanitária após vistoria' },
  { id: 'prazo_prorrogado', label: 'O prazo do documento foi prorrogado para', hasInput: true, inputLabel: 'Nova data' },
  { id: 'cumpriu_intimacao', label: 'Cumpriu o Termo de Intimação', hasInput: true, inputLabel: 'Termo nº' },
  { id: 'outros', label: 'Outros', hasInput: true, inputLabel: 'Especificar' },
];

export function CertidaoForm({ value, onChange, readOnly = false }: CertidaoFormProps) {
  const toggleOption = (optionId: string) => {
    if (readOnly) return;
    
    const newSelected = value.selectedOptions.includes(optionId)
      ? value.selectedOptions.filter(id => id !== optionId)
      : [...value.selectedOptions, optionId];
    
    onChange({
      ...value,
      selectedOptions: newSelected,
    });
  };

  const updateObservation = (optionId: string, text: string) => {
    if (readOnly) return;
    
    onChange({
      ...value,
      observations: {
        ...value.observations,
        [optionId]: text,
      },
    });
  };

  const updateOtherText = (text: string) => {
    if (readOnly) return;
    
    onChange({
      ...value,
      otherText: text,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileText className="h-4 w-4" />
        <span>Certifico e dou fé que em visita fiscal ao estabelecimento acima descrito:</span>
      </div>
      
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          {certidaoOptions.map((option) => (
            <div key={option.id} className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={value.selectedOptions.includes(option.id)}
                  onCheckedChange={() => toggleOption(option.id)}
                  disabled={readOnly}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <span className="text-sm">{option.label}</span>
                  
                  {option.hasInput && value.selectedOptions.includes(option.id) && (
                    <div className="mt-2">
                      {option.id === 'outros' ? (
                        <Textarea
                          placeholder={option.inputLabel}
                          value={value.otherText || ''}
                          onChange={(e) => updateOtherText(e.target.value)}
                          disabled={readOnly}
                          className="min-h-[80px] text-sm"
                        />
                      ) : (
                        <input
                          type="text"
                          placeholder={option.inputLabel}
                          value={value.observations[option.id] || ''}
                          onChange={(e) => updateObservation(option.id, e.target.value)}
                          disabled={readOnly}
                          className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      )}
                    </div>
                  )}
                </div>
              </label>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function formatCertidaoContent(data: CertidaoFormProps['value']): string {
  const lines: string[] = [];
  
  certidaoOptions.forEach((option) => {
    if (data.selectedOptions.includes(option.id)) {
      let text = `☑ ${option.label}`;
      
      if (option.hasInput) {
        if (option.id === 'outros') {
          text += data.otherText ? `: ${data.otherText}` : '';
        } else if (data.observations[option.id]) {
          text += `: ${data.observations[option.id]}`;
        }
      }
      
      lines.push(text);
    }
  });
  
  return lines.join('\n');
}

export function parseCertidaoContent(text: string): CertidaoFormProps['value'] {
  const result: CertidaoFormProps['value'] = {
    selectedOptions: [],
    observations: {},
    otherText: '',
  };
  
  // Try to parse checkbox format
  const lines = text.split('\n');
  lines.forEach((line) => {
    if (line.startsWith('☑')) {
      const content = line.substring(2).trim();
      
      certidaoOptions.forEach((option) => {
        if (content.toLowerCase().includes(option.label.toLowerCase().substring(0, 20))) {
          result.selectedOptions.push(option.id);
          
          // Extract observation if present
          const colonIndex = content.indexOf(':');
          if (colonIndex > -1 && option.hasInput) {
            const observation = content.substring(colonIndex + 1).trim();
            if (option.id === 'outros') {
              result.otherText = observation;
            } else {
              result.observations[option.id] = observation;
            }
          }
        }
      });
    }
  });
  
  return result;
}

export { certidaoOptions };
