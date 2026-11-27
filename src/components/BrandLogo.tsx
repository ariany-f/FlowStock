import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  /**
   * 'dark': para aplicar sobre FUNDOS ESCUROS (usa logo_dark.png e logo_name_dark.png que são BRANCOS)
   * 'light': para aplicar sobre FUNDOS CLAROS (usa logo.png e logo_name.png que são ESCUROS)
   */
  variant?: 'dark' | 'light';
  showPhrase?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  size = 'md', 
  variant = 'dark',
  showPhrase = true 
}) => {
  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { logoW: 28, logoH: 28, nameW: 90, nameH: 24 };
      case 'hero':
        return { logoW: 80, logoH: 80, nameW: 190, nameH: 50 };
      case 'lg':
        return { logoW: 60, logoH: 60, nameW: 145, nameH: 38 };
      case 'md':
      default:
        return { logoW: 38, logoH: 38, nameW: 115, nameH: 30 };
    }
  };

  const dims = getDimensions();

  // Para fundos escuros (como #0B192C / #1A2B3C): usamos a versão com elementos BRANCOS (_dark)
  // Para fundos claros (como #FFFFFF / #F8FAFC): usamos a versão com elementos ESCUROS (padrão)
  const isDarkBackground = variant === 'dark';

  const logoSource = isDarkBackground
    ? require('../../assets/brand/logo_dark.png')
    : require('../../assets/brand/logo.png');

  const nameSource = isDarkBackground
    ? require('../../assets/brand/logo_name_dark.png')
    : require('../../assets/brand/logo_name.png');

  return (
    <View style={styles.container}>
      <Image 
        source={logoSource} 
        style={{ width: dims.logoW, height: dims.logoH }}
        resizeMode="contain"
      />
      {showPhrase && (
        <Image 
          source={nameSource} 
          style={{ width: dims.nameW, height: dims.nameH, marginLeft: 8 }}
          resizeMode="contain"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
