// Logos oficiais para garantir exibição no PDF
// Estes logos são importados como assets para melhor controle

// Importação do logo Fiscaliz
import fiscalizLogo from '@/assets/logo-fiscaliz.png';

// Importação do Brasão oficial da Prefeitura de Goiânia
import brasaoGoiania from '@/assets/brasao-goiania.jpeg';

// Export do logo Fiscaliz
export const FISCALIZ_LOGO = fiscalizLogo;

// Brasão de Goiânia (imagem oficial importada)
export const BRASAO_GOIANIA_SVG = brasaoGoiania;

// Logo do SUS (SVG em cores oficiais - verde)
export const SUS_LOGO_SVG = `data:image/svg+xml;base64,${btoa(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 80">
    <rect x="18" y="8" width="24" height="64" fill="#006633"/>
    <rect x="8" y="28" width="64" height="24" fill="#006633"/>
    <text x="104" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#006633">SUS</text>
  </svg>`
)}`;
