import React from 'react';
import {
  Utensils,
  Coffee,
  IceCream,
  Sandwich,
  Flame,
  Soup,
  Package,
} from 'lucide-react';

interface ProductTileProps {
  art?: string;
  tint?: string;
  imageUrl?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const ProductTile: React.FC<ProductTileProps> = ({
  art = 'combo',
  tint = '#FFB81C',
  imageUrl,
  name = 'Món ăn',
  size = 'xs',
}) => {
  const sizeStyles = {
    xs: { width: '40px', height: '40px', borderRadius: '10px', fontSize: '18px' },
    sm: { width: '48px', height: '48px', borderRadius: '12px', fontSize: '22px' },
    md: { width: '64px', height: '64px', borderRadius: '16px', fontSize: '28px' },
    lg: { width: '84px', height: '84px', borderRadius: '20px', fontSize: '36px' },
  }[size];

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        style={{
          ...sizeStyles,
          objectFit: 'cover',
          border: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}
      />
    );
  }

  const getIcon = () => {
    const iconSize = size === 'xs' ? 18 : size === 'sm' ? 22 : size === 'md' ? 28 : 36;
    switch (art) {
      case 'burger':
        return <Sandwich size={iconSize} />;
      case 'chicken':
        return <Flame size={iconSize} />;
      case 'plate':
      case 'bowl':
        return <Soup size={iconSize} />;
      case 'cup':
        return <Coffee size={iconSize} />;
      case 'dessert':
        return <IceCream size={iconSize} />;
      case 'fries':
        return <Utensils size={iconSize} />;
      case 'combo':
      default:
        return <Package size={iconSize} />;
    }
  };

  return (
    <div
      style={{
        ...sizeStyles,
        backgroundColor: `${tint}20`,
        color: tint,
        border: `1px solid ${tint}40`,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
      title={name}
    >
      {getIcon()}
    </div>
  );
};
