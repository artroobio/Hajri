
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface ThemeContextType {
    brandName: string;
    setBrandName: (name: string) => void;
    brandLogo: string | null;
    setBrandLogo: (logo: string | null) => void;
    bgType: 'default' | 'custom' | 'white';
    setBgType: (type: 'default' | 'custom' | 'white') => void;
    backgroundImage: string | null;
    setBackgroundImage: (image: string | null) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    brandName: 'Jaguar Fitness',
    setBrandName: () => { },
    brandLogo: null,
    setBrandLogo: () => { },
    bgType: 'default',
    setBgType: () => { },
    backgroundImage: null,
    setBackgroundImage: () => { },
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [brandName, _setBrandName] = useState('Jaguar Fitness');
    const [brandLogo, _setBrandLogo] = useState<string | null>(null);
    const [bgType, _setBgType] = useState<'default' | 'custom' | 'white'>('default');
    const [backgroundImage, _setBackgroundImage] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    // Wrapped setters with logging - using useCallback for stability
    const setBrandName = useCallback((name: string) => {
        _setBrandName(name);
    }, []);

    const setBrandLogo = useCallback((logo: string | null) => {
        _setBrandLogo(logo);
    }, []);

    const setBgType = useCallback((type: 'default' | 'custom' | 'white') => {
        _setBgType(type);
    }, []);

    const setBackgroundImage = useCallback((image: string | null) => {
        _setBackgroundImage(image);
    }, []);

    // Load from LocalStorage on mount
    useEffect(() => {
        const storedBrandName = localStorage.getItem('brandName');
        const storedBrandLogo = localStorage.getItem('brandLogo');
        const storedBgType = localStorage.getItem('bgType');
        const storedBgImage = localStorage.getItem('backgroundImage');

        if (storedBrandName) _setBrandName(storedBrandName);
        if (storedBrandLogo) _setBrandLogo(storedBrandLogo);
        if (storedBgType) _setBgType(storedBgType as 'default' | 'custom' | 'white');
        if (storedBgImage) _setBackgroundImage(storedBgImage);
        setMounted(true);
    }, []);

    // Save to LocalStorage on change
    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem('brandName', brandName);
        if (brandLogo) localStorage.setItem('brandLogo', brandLogo);
        else localStorage.removeItem('brandLogo');
        localStorage.setItem('bgType', bgType);
        if (backgroundImage) localStorage.setItem('backgroundImage', backgroundImage);
        else localStorage.removeItem('backgroundImage');
    }, [brandName, brandLogo, bgType, backgroundImage, mounted]);

    return (
        <ThemeContext.Provider value={{
            brandName, setBrandName,
            brandLogo, setBrandLogo,
            bgType, setBgType,
            backgroundImage, setBackgroundImage
        }}>
            {children}
        </ThemeContext.Provider>
    );
}
