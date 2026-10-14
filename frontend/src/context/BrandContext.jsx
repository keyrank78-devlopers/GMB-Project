import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getBrand } from "../api/brand";

export const fallbackBrand = {
  name: "Keyrank Solutions",
  tagline: "Digital Marketing",
  logoUrl: null,
  photos: [],
};

const BrandContext = createContext(null);

export function BrandProvider({ children }) {
  const [brand, setBrand] = useState(fallbackBrand);

  useEffect(() => {
    let active = true;
    getBrand()
      .then((result) => {
        if (active && result.data) setBrand({ ...fallbackBrand, ...result.data });
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({ brand, setBrand }), [brand]);
  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) throw new Error("useBrand must be used inside BrandProvider");
  return context;
}
