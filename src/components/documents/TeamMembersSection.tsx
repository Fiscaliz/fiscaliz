import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Users, Edit3, X } from 'lucide-react';
import { FullScreenSignature } from './FullScreenSignature';

export interface TeamMember {
  id: string;
  name: string;
  registration_number?: string;
  role: 'auditor' | 'testemunha';
  signature_url?: string | null;
}

interface TeamMembersSectionProps {
  members: TeamMember[];
  onChange: (members: TeamMember[]) => void;
  documentId: string;
  editable: boolean;
}

export function TeamMembersSection({ members, onChange, documentId, editable }: TeamMembersSectionProps) {
  const [signingMemberId, setSigningMemberId] = useState<string | null>(null);

  const addMember = () => {
    const newMember: TeamMember = {
      id: crypto.randomUUID(),
      name: '',
      registration_number: '',
      role: 'auditor',
      signature_url: null,
    };
    onChange([...members, newMember]);
  };

  const removeMember = (id: string) => {
    onChange(members.filter(m => m.id !== id));
  };

  const updateMember = (id: string, field: keyof TeamMember, value: string) => {
    onChange(members.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const signingMember = members.find(m => m.id === signingMemberId);

  return (
    <div className="p-4 bg-muted/30 rounded-lg space-y-4 print:hidden">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4" />
          Equipe da Ação Fiscal
        </p>
        {editable && (
          <Button variant="outline" size="sm" onClick={addMember} className="text-xs gap-1">
            <Plus className="h-3 w-3" />
            Adicionar
          </Button>
        )}
      </div>

      {members.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Nenhum auditor ou testemunha adicional. Clique em "Adicionar" para incluir.
        </p>
      )}

      {members.map((member) => (
        <div key={member.id} className="border rounded-lg p-3 space-y-3 bg-card">
          <div className="flex items-center justify-between">
            <Select
              value={member.role}
              onValueChange={(val) => updateMember(member.id, 'role', val)}
              disabled={!editable}
            >
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auditor">Auditor Fiscal</SelectItem>
                <SelectItem value="testemunha">Testemunha</SelectItem>
              </SelectContent>
            </Select>
            {editable && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeMember(member.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Nome completo</Label>
              <Input
                value={member.name}
                onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                placeholder="Nome"
                className="text-xs h-8"
                disabled={!editable}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Matrícula {member.role === 'testemunha' ? '(opcional)' : ''}</Label>
              <Input
                value={member.registration_number || ''}
                onChange={(e) => updateMember(member.id, 'registration_number', e.target.value)}
                placeholder="Matrícula"
                className="text-xs h-8"
                disabled={!editable}
              />
            </div>
          </div>

          {/* Signature */}
          <div className="flex items-center gap-2">
            {member.signature_url ? (
              <div className="flex items-center gap-2 flex-1">
                <img src={member.signature_url} alt="Assinatura" className="h-10 border rounded" />
                {editable && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateMember(member.id, 'signature_url', '')}>
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ) : editable ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSigningMemberId(member.id)}
                className="text-xs gap-1 flex-1 h-10 border-dashed"
              >
                <Edit3 className="h-3 w-3" />
                Assinar
              </Button>
            ) : (
              <div className="h-10 flex-1 border-b border-dashed border-muted-foreground" />
            )}
          </div>
        </div>
      ))}

      {/* Full Screen Signature Modal for team members */}
      {signingMember && (
        <FullScreenSignature
          isOpen={!!signingMemberId}
          onClose={() => setSigningMemberId(null)}
          documentId={documentId}
          title={`Assinatura - ${signingMember.name || signingMember.role === 'auditor' ? 'Auditor' : 'Testemunha'}`}
          onSave={(url) => {
            onChange(members.map(m => m.id === signingMemberId ? { ...m, signature_url: url } : m));
            setSigningMemberId(null);
          }}
        />
      )}
    </div>
  );
}

/** Render team member signatures for PDF/print view */
export function TeamMembersSignatures({ members }: { members: TeamMember[] }) {
  if (!members || members.length === 0) return null;

  return (
    <>
      {members.map((member) => (
        <div key={member.id} className="text-center space-y-2">
          {member.signature_url ? (
            <img src={member.signature_url} alt="Assinatura" className="h-14 mx-auto" />
          ) : (
            <div className="h-16 border-b border-dashed border-muted-foreground print:border-gray-400" />
          )}
          <p className="text-sm font-semibold">
            {member.role === 'auditor' ? 'Auditor Fiscal' : 'Testemunha'}
          </p>
          <div className="text-xs text-muted-foreground print:text-gray-600">
            <p>{member.name || '___________________________'}</p>
            {member.registration_number && <p>Mat. {member.registration_number}</p>}
          </div>
        </div>
      ))}
    </>
  );
}
