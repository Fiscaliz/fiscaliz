import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Building2, 
  FileText, 
  TrendingUp, 
  ShieldAlert,
  Briefcase
} from 'lucide-react';

interface DailyAction {
  documentType: string;
  economicActivity: string;
  actionType: string;
  riskLevel: 'I' | 'II' | 'III' | null;
  establishment: string;
  establishmentId: string | null;
  isInternal: boolean;
  actionDateFull: string;
}

interface StatisticalBreakdownProps {
  dailyActions: DailyAction[];
  documentTypeLabels: Record<string, string>;
}

// Map CNAE descriptions to simplified establishment categories
function categorizeEstablishment(activity: string): string {
  const lower = activity.toLowerCase();
  
  if (lower.includes('indústria') || lower.includes('industria') || lower.includes('fabricação') || lower.includes('fabricacao')) return 'Indústria de Alimentos';
  if (lower.includes('hipermercado')) return 'Hipermercado';
  if (lower.includes('supermercado')) return 'Supermercado';
  if (lower.includes('minimercado') || lower.includes('mercearia')) return 'Minimercado/Mercearia';
  if (lower.includes('padaria') || lower.includes('panificação') || lower.includes('panificacao')) return 'Padaria';
  if (lower.includes('açougue') || lower.includes('acougue') || lower.includes('carne')) return 'Açougue';
  if (lower.includes('confeitaria') || lower.includes('doces')) return 'Confeitaria';
  if (lower.includes('restaurante')) return 'Restaurante';
  if (lower.includes('lanchonete') || lower.includes('lanche')) return 'Lanchonete';
  if (lower.includes('bar') && !lower.includes('barr')) return 'Bar';
  if (lower.includes('pizzaria')) return 'Pizzaria';
  if (lower.includes('ambulante')) return 'Ambulante';
  if (lower.includes('feirante') || lower.includes('feira')) return 'Feirante';
  if (lower.includes('peixaria') || lower.includes('pescado')) return 'Peixaria';
  if (lower.includes('hortifruti') || lower.includes('hortifrutigranjeiro') || lower.includes('sacolão') || lower.includes('sacolao')) return 'Hortifruti/Sacolão';
  if (lower.includes('serviço de alimento') || lower.includes('servico de alimento') || lower.includes('refeição') || lower.includes('refeicao') || lower.includes('catering')) return 'Serviço de Alimentação';
  if (lower.includes('cozinha industrial')) return 'Cozinha Industrial';
  if (lower.includes('depósito') || lower.includes('deposito') || lower.includes('armazém') || lower.includes('armazem') || lower.includes('distribuição') || lower.includes('distribuicao')) return 'Depósito/Distribuição';
  if (lower.includes('comércio varejista') || lower.includes('comercio varejista') || lower.includes('varejo')) return 'Comércio Varejista';
  if (lower.includes('embalagem')) return 'Indústria de Embalagem';
  if (lower.includes('bebida')) return 'Com. Varejista Bebidas';
  
  if (!activity || activity.trim() === '') return 'Outros';
  return activity.length > 30 ? activity.substring(0, 28) + '…' : activity;
}

const actionTypeColors: Record<string, string> = {
  'Inspeção': 'bg-primary/10 text-primary',
  'Reinspeção': 'bg-info/10 text-info',
  'Denúncia': 'bg-warning/10 text-warning',
  'Op.Conjunta': 'bg-accent/80 text-accent-foreground',
  'Serviço Interno': 'bg-muted text-muted-foreground',
  'Outros': 'bg-muted text-muted-foreground',
};

const riskColors: Record<string, string> = {
  'I': 'text-success',
  'II': 'text-warning',
  'III': 'text-destructive',
};

export function StatisticalBreakdown({ dailyActions, documentTypeLabels }: StatisticalBreakdownProps) {
  // Group by establishment category
  const categoryStats = useMemo(() => {
    const cats = new Map<string, {
      count: number;
      docs: Map<string, number>;
      actions: Map<string, number>;
      risks: Map<string, number>;
      uniqueDates: Set<string>;
    }>();

    const fieldActions = dailyActions.filter(a => !a.isInternal);

    fieldActions.forEach(action => {
      const cat = categorizeEstablishment(action.economicActivity);
      const existing = cats.get(cat) || {
        count: 0,
        docs: new Map(),
        actions: new Map(),
        risks: new Map(),
        uniqueDates: new Set(),
      };

      existing.count++;
      existing.docs.set(action.documentType, (existing.docs.get(action.documentType) || 0) + 1);
      existing.actions.set(action.actionType, (existing.actions.get(action.actionType) || 0) + 1);
      if (action.riskLevel) {
        existing.risks.set(action.riskLevel, (existing.risks.get(action.riskLevel) || 0) + 1);
      }
      existing.uniqueDates.add(action.actionDateFull);
      
      cats.set(cat, existing);
    });

    return Array.from(cats.entries())
      .sort((a, b) => b[1].count - a[1].count);
  }, [dailyActions]);

  // Action type breakdown
  const actionBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    dailyActions.filter(a => !a.isInternal).forEach(a => {
      map.set(a.actionType, (map.get(a.actionType) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [dailyActions]);

  // Risk distribution
  const riskDistribution = useMemo(() => {
    const map = new Map<string, number>();
    dailyActions.filter(a => !a.isInternal && a.riskLevel).forEach(a => {
      map.set(a.riskLevel!, (map.get(a.riskLevel!) || 0) + 1);
    });
    return map;
  }, [dailyActions]);

  const totalField = dailyActions.filter(a => !a.isInternal).length;
  const totalInternal = dailyActions.filter(a => a.isInternal).length;
  const riskLabels: Record<string, string> = { 'I': 'Baixo', 'II': 'Médio', 'III': 'Alto' };

  if (dailyActions.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Distribuição por Tipo de Ação */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            Tipo de Ação Fiscal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {actionBreakdown.map(([type, count]) => {
            const pct = totalField > 0 ? Math.round((count / totalField) * 100) : 0;
            return (
              <div key={type} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${actionTypeColors[type] || 'bg-muted text-muted-foreground'}`}>
                      {type}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">{count} ({pct}%)</span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </div>
            );
          })}
          {totalInternal > 0 && (
            <div className="pt-1 border-t mt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                  Serviço Interno
                </span>
                <span className="text-xs text-muted-foreground">{totalInternal}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribuição por Risco */}
      {riskDistribution.size > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-warning" />
              Risco Sanitário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {(['I', 'II', 'III'] as const).map(level => {
                const count = riskDistribution.get(level) || 0;
                return (
                  <div key={level} className="text-center p-3 rounded-xl bg-muted/50">
                    <p className={`text-xl font-bold ${riskColors[level]}`}>{count}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {riskLabels[level]} ({level})
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Por Tipo de Estabelecimento */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4 text-info" />
            Estabelecimentos por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {categoryStats.map(([cat, stats]) => {
            const docEntries = Array.from(stats.docs.entries())
              .sort((a, b) => b[1] - a[1]);
            
            return (
              <div key={cat} className="p-3 rounded-xl bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate flex-1">{cat}</span>
                  <Badge variant="secondary" className="text-[10px] ml-2">
                    {stats.uniqueDates.size} visita{stats.uniqueDates.size !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                {/* Documentos emitidos nesta categoria */}
                <div className="flex flex-wrap gap-1.5">
                  {docEntries.map(([docType, count]) => (
                    <span key={docType} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-background border border-border">
                      <span className="font-medium">{count}×</span>
                      <span className="text-muted-foreground">
                        {documentTypeLabels[docType]?.split(' ').slice(0, 2).join(' ') || docType}
                      </span>
                    </span>
                  ))}
                </div>

                {/* Ação fiscal type breakdown for this category */}
                <div className="flex flex-wrap gap-1">
                  {Array.from(stats.actions.entries()).map(([aType, count]) => (
                    <span key={aType} className={`text-[10px] px-1.5 py-0.5 rounded ${actionTypeColors[aType] || 'bg-muted text-muted-foreground'}`}>
                      {count}× {aType}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Resumo de Documentos (totais) */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-success" />
            Documentos Emitidos — Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const docTotals = new Map<string, number>();
            dailyActions.forEach(a => {
              docTotals.set(a.documentType, (docTotals.get(a.documentType) || 0) + 1);
            });
            const sorted = Array.from(docTotals.entries()).sort((a, b) => b[1] - a[1]);
            const max = sorted.length > 0 ? sorted[0][1] : 1;

            return (
              <div className="space-y-2">
                {sorted.map(([docType, count]) => (
                  <div key={docType} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">{documentTypeLabels[docType] || docType}</span>
                      <span className="text-sm font-semibold">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t mt-2">
                  <span className="text-xs font-medium">Total</span>
                  <span className="text-sm font-bold">{dailyActions.length}</span>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
