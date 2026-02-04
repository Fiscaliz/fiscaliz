
# Plano de Redesign Visual - Fiscaliz

## Objetivo
Modernizar a interface do aplicativo Fiscaliz para um visual profissional, elegante e contemporâneo, mantendo todas as funcionalidades existentes intactas.

---

## 1. Nova Paleta de Cores

### Cores Principais (valores HEX)
| Cor | Hex | Uso |
|-----|-----|-----|
| **Azul Petróleo** | `#0F4C5C` | Primary - Botões, destaques, sidebar |
| **Verde Institucional** | `#2E8B57` | Secondary - Ações positivas, sucesso |
| **Grafite Escuro** | `#1E293B` | Foreground - Textos principais |
| **Cinza Carvão** | `#475569` | Muted - Textos secundários |
| **Off-White** | `#F8FAFC` | Background - Fundo principal |
| **Branco Puro** | `#FFFFFF` | Card - Superfícies elevadas |
| **Teal Suave** | `#14B8A6` | Accent - Destaques, badges |
| **Roxo Elegante** | `#8B5CF6` | Info - Notificações, status |

### Cores de Status
| Status | Hex |
|--------|-----|
| Success | `#10B981` |
| Warning | `#F59E0B` |
| Destructive | `#EF4444` |
| Info | `#0EA5E9` |

---

## 2. Sistema Tipográfico

### Fonte Recomendada
**Inter** (já instalada) com configurações refinadas:

```text
Hierarquia:
├── Display (32px, font-weight: 700, tracking: -0.02em)
├── Título H1 (24px, font-weight: 600, tracking: -0.01em)
├── Título H2 (20px, font-weight: 600)
├── Título H3 (16px, font-weight: 600)
├── Body (14px, font-weight: 400, line-height: 1.6)
├── Caption (12px, font-weight: 500, text-muted)
└── Micro (10px, font-weight: 600, uppercase, tracking: 0.05em)
```

---

## 3. Sistema de Grid e Espaçamento

### Paddings e Margins
- **Container**: `max-w-md mx-auto` (mobile-first)
- **Page Padding**: `px-5 py-6` (mais respiro)
- **Card Padding**: `p-5` (uniforme)
- **Gap entre seções**: `space-y-6`
- **Gap entre cards**: `gap-4`

### Grid System
- **2 colunas**: Quick actions, stat cards
- **Full width**: Formulários, listas
- **Auto-grid**: `grid-cols-[repeat(auto-fit,minmax(150px,1fr))]`

---

## 4. Componentes Redesenhados

### 4.1 Cards Modernos
- Bordas sutis (`border border-border/50`)
- Sombras suaves (`shadow-sm hover:shadow-md`)
- Cantos arredondados (`rounded-2xl`)
- Transições elegantes (`transition-all duration-200`)

### 4.2 Botões Refinados
- Primary: Gradiente sutil com hover escurecido
- Secondary: Outline com preenchimento no hover
- Ghost: Transparente com background no hover
- Altura mínima touch-friendly: `h-12` (48px)
- Cantos: `rounded-xl`

### 4.3 Inputs Elegantes
- Borda mais leve (`border-border/60`)
- Focus ring em teal (`ring-teal-500/30`)
- Placeholder mais claro
- Labels com tipografia micro

### 4.4 Badges e Status
- Cores pastéis suaves
- Ícones menores integrados
- Cantos arredondados (`rounded-full`)
- Padding horizontal maior

---

## 5. Microinterações e Animações

### Transições Existentes (Refinadas)
```text
├── fade-in: 0.25s ease-out
├── scale-in: 0.2s ease-out
├── slide-up: 0.3s cubic-bezier(0.16, 1, 0.3, 1)
└── hover-lift: translateY(-2px) + shadow elevation
```

### Novas Animações
- **Card hover**: Elevação sutil + sombra
- **Button press**: Scale 0.98 + feedback visual
- **Page transitions**: Fade + slide suave
- **Loading states**: Skeleton com shimmer effect

---

## 6. Telas Redesenhadas

### 6.1 Login/Cadastro (`Auth.tsx`)
- Header com gradiente mais suave e moderno
- Logo com sombra mais elegante
- Card de formulário com glassmorphism refinado
- Botões de identificação como chips modernos
- Footer minimalista

### 6.2 Dashboard Principal (`Dashboard.tsx`)
- Stat cards com ícones em círculos coloridos
- Gráficos com cores da nova paleta
- Tabs com indicador animado
- Cards de métricas com micro-animações

### 6.3 Tela Inicial (`Home.tsx`)
- BrandHeader com gradiente mais elegante
- Quick actions com hover effect sofisticado
- Listas com cards espaçados e sombras suaves
- CTA principal com gradiente premium

### 6.4 Listagens (`Documents.tsx`, `MonthlyReports.tsx`)
- Tabs com design pill/segment
- Cards de item com layout mais limpo
- Badges de status com cores pastéis
- Empty states com ilustrações suaves

### 6.5 Detalhes e Formulários
- Headers com subtítulo em destaque
- Campos agrupados em seções visuais
- Botões de ação com hierarquia clara
- Preview de PDF com moldura elegante

### 6.6 Perfil (`Profile.tsx`)
- Avatar/Logo em círculo com borda gradiente
- Menu items com ícones em containers coloridos
- Seções bem delimitadas
- Footer com versão estilizada

---

## 7. Arquivos a Modificar

### CSS e Configuração
1. **`src/index.css`** - Atualizar variáveis CSS com nova paleta
2. **`tailwind.config.ts`** - Adicionar novas cores e animações

### Componentes de Layout
3. **`src/components/layout/BrandHeader.tsx`** - Gradiente moderno
4. **`src/components/layout/Header.tsx`** - Tipografia refinada
5. **`src/components/layout/BottomNav.tsx`** - Estilo mais clean
6. **`src/components/layout/AppLayout.tsx`** - Espaçamentos

### Páginas Principais
7. **`src/pages/Auth.tsx`** - Redesign completo visual
8. **`src/pages/Home.tsx`** - Cards e ações refinados
9. **`src/pages/Dashboard.tsx`** - Métricas modernizadas
10. **`src/pages/Documents.tsx`** - Lista elegante
11. **`src/pages/MonthlyReports.tsx`** - Cards de relatório
12. **`src/pages/Profile.tsx`** - Menu moderno
13. **`src/pages/NewAction.tsx`** - Seleção de motivo
14. **`src/pages/DocumentDetail.tsx`** - Visualização
15. **`src/pages/Settings.tsx`** - Configurações

### Componentes UI Base
16. **`src/components/ui/button.tsx`** - Variantes refinadas
17. **`src/components/ui/card.tsx`** - Sombras e bordas
18. **`src/components/ui/badge.tsx`** - Cores pastéis
19. **`src/components/ui/input.tsx`** - Estilo focus

---

## 8. Detalhes Técnicos

### Variáveis CSS Atualizadas
```css
:root {
  --background: 210 40% 98%;    /* Off-white */
  --foreground: 215 28% 17%;    /* Grafite escuro */
  --primary: 192 78% 21%;       /* Azul petróleo */
  --secondary: 146 48% 36%;     /* Verde institucional */
  --accent: 168 76% 42%;        /* Teal */
  --muted: 215 16% 47%;         /* Cinza carvão */
}
```

### Gradientes Premium
```css
--gradient-primary: linear-gradient(135deg, #0F4C5C 0%, #1A6B7C 100%);
--gradient-brand: linear-gradient(135deg, #0F4C5C 0%, #2E8B57 100%);
--gradient-subtle: linear-gradient(180deg, transparent 0%, rgba(15,76,92,0.03) 100%);
```

### Sombras Refinadas
```css
--shadow-sm: 0 1px 2px rgba(30, 41, 59, 0.04);
--shadow-md: 0 4px 12px rgba(30, 41, 59, 0.08);
--shadow-lg: 0 12px 24px rgba(30, 41, 59, 0.12);
--shadow-glow: 0 0 24px rgba(20, 184, 166, 0.15);
```

---

## 9. Garantias de Compatibilidade

- **Funcionalidades preservadas**: Nenhuma alteração em lógica de negócio
- **Responsividade**: Design adaptativo para mobile, tablet e desktop
- **Acessibilidade**: Contraste adequado, touch targets de 44px+
- **Performance**: Apenas alterações CSS e className
- **Dark mode**: Variáveis mantidas e atualizadas para consistência

---

## Resultado Esperado
Uma interface moderna, limpa e confiável, com personalidade premium mas acessível, transmitindo profissionalismo institucional com sofisticação contemporânea.
