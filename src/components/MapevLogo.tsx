import React from 'react';

interface MapevLogoProps {
  className?: string;
}

/**
 * Reprodução vetorial 1:1 da logo oficial MAPEV SOLUÇÕES LOGÍSTICAS:
 * - 5 faixas horizontais amarelas (#F5C400) unidas à direita em diagonal
 * - Silhueta branca da cabine do caminhão com arco de roda na base
 * - Tipografia MAPEV expandida + linha divisória branca + SOLUÇÕES LOGÍSTICAS
 */
export const MapevLogo: React.FC<MapevLogoProps> = ({ className = 'h-12 w-auto' }) => {
  return (
    <svg
      viewBox="0 0 1000 1000"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="MAPEV Soluções Logísticas"
    >
      {/* Bloco Amarelo (5 barras horizontais conectadas pela coluna diagonal à direita) */}
      <path
        fill="#F5C400"
        fillRule="evenodd"
        clipRule="evenodd"
        d="
          M 88 26
          L 460 26
          L 584 524
          L 88 524
          L 88 430
          L 494 430
          L 482 392
          L 88 392
          L 88 324
          L 461 324
          L 449 285
          L 88 285
          L 88 218
          L 429 218
          L 417 178
          L 88 178
          L 88 112
          L 397 112
          L 388 85
          L 88 85
          Z
        "
      />

      {/* Silhueta Branca da Cabine do Caminhão com Arco de Roda */}
      <path
        fill="#FFFFFF"
        d="
          M 505 96
          L 738 96
          L 782 322
          L 868 322
          L 918 524
          L 825 524
          A 65 68 0 0 0 695 524
          L 598 524
          Z
        "
      />

      {/* Nome MAPEV em letras brancas largas e pesadas */}
      <g transform="translate(500, 768) scale(1.36, 1)">
        <text
          x="0"
          y="0"
          fill="#FFFFFF"
          fontFamily="'Arial Black', ' Plus Jakarta Sans', Arial, Helvetica, sans-serif"
          fontWeight="900"
          fontSize="190"
          textAnchor="middle"
          letterSpacing="6"
        >
          MAPEV
        </text>
      </g>

      {/* Filete horizontal branco */}
      <rect x="18" y="836" width="964" height="19" fill="#FFFFFF" />

      {/* Subtítulo SOLUÇÕES LOGÍSTICAS */}
      <text
        x="505"
        y="952"
        fill="#FFFFFF"
        fontFamily="'Plus Jakarta Sans', Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="68"
        textAnchor="middle"
        letterSpacing="8"
      >
        SOLUÇÕES LOGÍSTICAS
      </text>
    </svg>
  );
};
