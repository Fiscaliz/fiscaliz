import { useEffect, useRef, useMemo, useState, forwardRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat'; // Import heatmap plugin
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Coordenadas aproximadas dos principais bairros de Goiânia
const GOIANIA_BAIRROS: Record<string, [number, number]> = {
  // Setor Central e próximos
  'SETOR CENTRAL': [-16.6799, -49.2549],
  'SETOR OESTE': [-16.6862, -49.2680],
  'SETOR BUENO': [-16.7033, -49.2656],
  'SETOR MARISTA': [-16.7150, -49.2600],
  'SETOR SUL': [-16.7200, -49.2500],
  'SETOR NORTE': [-16.6600, -49.2600],
  'SETOR LESTE': [-16.6750, -49.2400],
  'SETOR LESTE UNIVERSITARIO': [-16.6780, -49.2350],
  'SETOR NEGRÃO DE LIMA': [-16.6700, -49.2350],
  'SETOR COIMBRA': [-16.7100, -49.2400],
  'SETOR CAMPINAS': [-16.7050, -49.2700],
  'SETOR PARQUE TREMENDAO': [-16.7300, -49.2900],
  'SETOR BELA VISTA': [-16.6950, -49.2450],
  'SET BELA VISTA': [-16.6950, -49.2450],
  'PARQUE ANHANGUERA': [-16.7400, -49.3200],
  'PARQUE ANHANGUERA II': [-16.7450, -49.3250],
  'SETOR PEDRO LUDOVICO': [-16.6900, -49.2500],
  'JARDIM GOIAS': [-16.7250, -49.2350],
  'JARDIM AMERICA': [-16.6820, -49.2730],
  'MARISTA': [-16.7150, -49.2600],
  'SETOR AEROPORTO': [-16.7000, -49.2250],
  'RES VEREDA DOS BURITIS': [-16.7500, -49.3100],
  'LOT MOINHO DOS VENTOS': [-16.7600, -49.3000],
  'LOT CELINA PARK': [-16.7700, -49.3050],
  'VILA ALPES': [-16.6900, -49.3000],
  'CELINA PARK': [-16.7700, -49.3050],
  'RES ELDORADO': [-16.7650, -49.3150],
  'PARQUE AMAZONIA': [-16.7550, -49.3300],
  'SETOR VILA NOVA': [-16.6800, -49.2800],
  'SETOR DOS FUNCIONARIOS': [-16.7050, -49.2550],
};

// Coordenada padrão de Goiânia
const GOIANIA_CENTER: [number, number] = [-16.6864, -49.2643];

interface BairroData {
  bairro: string;
  total: number;
  riskIII: number;
  riskII: number;
  riskI: number;
  semRisco: number;
  coords: [number, number] | null;
}

interface RiskMapProps {
  divisionActions: any[];
  divisionDocuments: any[];
}

function normalizeBairro(raw: string): string {
  return raw.toUpperCase().trim()
    .replace(/^SET\s+/, 'SETOR ')
    .replace(/\s+/g, ' ');
}

function findBairroCoords(bairro: string): [number, number] | null {
  const normalized = normalizeBairro(bairro);
  // Busca exata
  if (GOIANIA_BAIRROS[normalized]) return GOIANIA_BAIRROS[normalized];
  // Busca parcial
  const key = Object.keys(GOIANIA_BAIRROS).find(k =>
    normalized.includes(k) || k.includes(normalized)
  );
  return key ? GOIANIA_BAIRROS[key] : null;
}

function getRiskColor(d: BairroData): string {
  if (d.riskIII > 0) return '#EF4444';   // Vermelho - Alto risco
  if (d.riskII > 0) return '#F59E0B';    // Amarelo - Médio risco
  if (d.riskI > 0) return '#22c55e';     // Verde - Baixo risco
  return '#94a3b8';                       // Cinza - Sem info
}

export const RiskMap = forwardRef<HTMLDivElement, RiskMapProps>(({ divisionActions, divisionDocuments }, ref) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);

  // Agregar dados por bairro
  const bairroData = useMemo(() => {
    const map = new Map<string, BairroData>();

    divisionActions.forEach((action: any) => {
      const rawBairro = action.establishments?.bairro;
      if (!rawBairro) return;
      const bairro = normalizeBairro(rawBairro);
      const risk = action.establishments?.risk_level;
      const coords = findBairroCoords(bairro);

      if (!map.has(bairro)) {
        map.set(bairro, { bairro, total: 0, riskIII: 0, riskII: 0, riskI: 0, semRisco: 0, coords });
      }
      const entry = map.get(bairro)!;
      entry.total++;
      if (risk === 'III') entry.riskIII++;
      else if (risk === 'II') entry.riskII++;
      else if (risk === 'I') entry.riskI++;
      else entry.semRisco++;
    });

    return Array.from(map.values());
  }, [divisionActions]);

  const bairrosWithCoords = useMemo(() => bairroData.filter(b => b.coords), [bairroData]);
  const bairrosWithoutCoords = useMemo(() => bairroData.filter(b => !b.coords), [bairroData]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Se o mapa já existe, apenas atualiza camadas
    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        center: GOIANIA_CENTER,
        zoom: 12,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors & © CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Limpar camadas anteriores
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker || (layer as any)._heat) {
        map.removeLayer(layer);
      }
    });

    if (showHeatmap) {
      // Camada de Calor (Heatmap)
      const heatPoints: [number, number, number][] = [];
      
      bairrosWithCoords.forEach(d => {
        if (!d.coords) return;
        // Peso do calor: Alto Risco (III) tem peso 3x, Médio (II) 2x, Baixo (I) 1x
        // Multiplicado pelo volume de ações no local
        const intensity = (d.riskIII * 3) + (d.riskII * 2) + (d.riskI * 1) + (d.semRisco * 0.5);
        // Normalizar intensidade para visualização (max 1.0 por ponto, mas heatmap acumula)
        // Adicionamos vários pontos próximos ou um ponto com intensidade? L.heat usa intensidade 0-1
        // Vamos adicionar pontos repetidos levemente dispersos para criar a mancha
        
        // Adicionar um ponto central com intensidade baseada no total ponderado
        // Limitando intensidade para não "estourar" o vermelho imediatamente
        const normalizedIntensity = Math.min(intensity / 5, 1.0); 
        heatPoints.push([d.coords[0], d.coords[1], normalizedIntensity * 50]); // Multiplicador alto para garantir visibilidade
      });

      if (heatPoints.length > 0) {
        (L as any).heatLayer(heatPoints, {
          radius: 35,
          blur: 25,
          maxZoom: 14,
          max: 10.0,
          gradient: { 0.2: 'blue', 0.4: 'lime', 0.6: 'yellow', 0.8: 'orange', 1.0: 'red' }
        }).addTo(map);
      }
    } else {
      // Camada de Bolhas (Markers)
      bairrosWithCoords.forEach(d => {
        if (!d.coords) return;

        const color = getRiskColor(d);
        const radius = Math.max(10, Math.min(40, d.total * 6));

        const circle = L.circleMarker(d.coords, {
          radius,
          fillColor: color,
          color: '#fff',
          weight: 1,
          opacity: 0.9,
          fillOpacity: 0.7,
        }).addTo(map);

        const dominantRisk = d.riskIII > 0 ? 'Alto (III)' : d.riskII > 0 ? 'Médio (II)' : d.riskI > 0 ? 'Baixo (I)' : 'Não informado';
        const riskLabel = d.riskIII > 0 ? '🔴' : d.riskII > 0 ? '🟡' : d.riskI > 0 ? '🟢' : '⚪';

        circle.bindPopup(`
          <div style="font-family: sans-serif; min-width: 160px;">
            <strong style="font-size: 13px;">${d.bairro}</strong><br/>
            <span style="font-size: 12px; color: #666;">Risco predominante: ${riskLabel} ${dominantRisk}</span>
            <hr style="margin: 6px 0; border-color: #eee"/>
            <table style="font-size: 11px; width: 100%;">
              <tr><td>Total ações</td><td style="text-align:right; font-weight:bold">${d.total}</td></tr>
              ${d.riskIII > 0 ? `<tr><td>🔴 Alto risco</td><td style="text-align:right; color: #EF4444; font-weight:bold">${d.riskIII}</td></tr>` : ''}
              ${d.riskII > 0 ? `<tr><td>🟡 Médio risco</td><td style="text-align:right; color: #F59E0B; font-weight:bold">${d.riskII}</td></tr>` : ''}
              ${d.riskI > 0 ? `<tr><td>🟢 Baixo risco</td><td style="text-align:right; color: #22c55e; font-weight:bold">${d.riskI}</td></tr>` : ''}
              ${d.semRisco > 0 ? `<tr><td>⚪ Sem info</td><td style="text-align:right">${d.semRisco}</td></tr>` : ''}
            </table>
          </div>
        `);
      });
    }

  }, [bairrosWithCoords, showHeatmap]);

  const totalOnMap = bairrosWithCoords.reduce((s, b) => s + b.total, 0);
  const totalOffMap = bairrosWithoutCoords.reduce((s, b) => s + b.total, 0);

  return (
    <div className="space-y-3">
      {/* Controles */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Switch 
            id="heatmap-mode" 
            checked={showHeatmap} 
            onCheckedChange={setShowHeatmap} 
          />
          <Label htmlFor="heatmap-mode" className="text-xs font-medium cursor-pointer">
            Visualizar como Mapa de Calor
          </Label>
        </div>
        
        {!showHeatmap && (
          <div className="flex gap-2 text-[10px]">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Alto</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400" /> Médio</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> Baixo</span>
          </div>
        )}
      </div>

      {/* Mapa */}
      <div
        ref={mapRef}
        className="w-full rounded-xl overflow-hidden border border-border relative z-0"
        style={{ height: 320 }}
      />

      {/* Bairros sem coordenadas */}
      {bairrosWithoutCoords.length > 0 && (
        <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-2">
          <p className="font-medium mb-1">Bairros sem localização mapeada ({totalOffMap} ações):</p>
          <div className="flex flex-wrap gap-1">
            {bairrosWithoutCoords.map(b => (
              <Badge key={b.bairro} variant="outline" className="text-[10px]">
                {b.bairro} ({b.total})
              </Badge>
            ))}
          </div>
        </div>
      )}

      {totalOnMap === 0 && bairrosWithCoords.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-4">
          Nenhuma ação com bairro registrado neste período
        </p>
      )}
    </div>
  );
});
RiskMap.displayName = 'RiskMap';
