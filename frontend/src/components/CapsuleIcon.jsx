import React from 'react';

/**
 * Custom capsule/pill icon with one half lightly filled.
 * Matches the visual language of lucide-react icons.
 */
const CapsuleIcon = ({ size = 18, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Full capsule outline (vertical) */}
    <rect x="7" y="2" width="10" height="20" rx="5" ry="5" />
    {/* Filled bottom half of the capsule */}
    <path
      d="M7 12 h10 v5 a5 5 0 0 1 -10 0 Z"
      fill="currentColor"
      fillOpacity="0.35"
      stroke="none"
    />
    {/* Dividing line in the middle */}
    <line x1="7" y1="12" x2="17" y2="12" />
  </svg>
);

export default CapsuleIcon;
