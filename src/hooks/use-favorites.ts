import { useEffect, useState } from "react";

const STORAGE_KEY = "drh_favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setFavorites(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isFavorite = (id: string) => !!favorites[id];

  return { favorites, toggleFavorite, isFavorite };
}
