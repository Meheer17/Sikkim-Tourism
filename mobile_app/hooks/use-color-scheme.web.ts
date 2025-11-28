import { useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme(): ColorSchemeName {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  useEffect(() => {
    setHasHydrated(true);
    
    const subscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
      setColorScheme(newColorScheme);
    });

    return () => subscription.remove();
  }, []);

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
