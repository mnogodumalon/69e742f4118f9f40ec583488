import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Restaurant, Gerichte, Bestellungen } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [restaurant, setRestaurant] = useState<Restaurant[]>([]);
  const [gerichte, setGerichte] = useState<Gerichte[]>([]);
  const [bestellungen, setBestellungen] = useState<Bestellungen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [restaurantData, gerichteData, bestellungenData] = await Promise.all([
        LivingAppsService.getRestaurant(),
        LivingAppsService.getGerichte(),
        LivingAppsService.getBestellungen(),
      ]);
      setRestaurant(restaurantData);
      setGerichte(gerichteData);
      setBestellungen(bestellungenData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [restaurantData, gerichteData, bestellungenData] = await Promise.all([
          LivingAppsService.getRestaurant(),
          LivingAppsService.getGerichte(),
          LivingAppsService.getBestellungen(),
        ]);
        setRestaurant(restaurantData);
        setGerichte(gerichteData);
        setBestellungen(bestellungenData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const restaurantMap = useMemo(() => {
    const m = new Map<string, Restaurant>();
    restaurant.forEach(r => m.set(r.record_id, r));
    return m;
  }, [restaurant]);

  const gerichteMap = useMemo(() => {
    const m = new Map<string, Gerichte>();
    gerichte.forEach(r => m.set(r.record_id, r));
    return m;
  }, [gerichte]);

  return { restaurant, setRestaurant, gerichte, setGerichte, bestellungen, setBestellungen, loading, error, fetchAll, restaurantMap, gerichteMap };
}