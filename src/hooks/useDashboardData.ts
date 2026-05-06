import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Gerichte, Restaurant, Bestellungen } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [gerichte, setGerichte] = useState<Gerichte[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant[]>([]);
  const [bestellungen, setBestellungen] = useState<Bestellungen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [gerichteData, restaurantData, bestellungenData] = await Promise.all([
        LivingAppsService.getGerichte(),
        LivingAppsService.getRestaurant(),
        LivingAppsService.getBestellungen(),
      ]);
      setGerichte(gerichteData);
      setRestaurant(restaurantData);
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
        const [gerichteData, restaurantData, bestellungenData] = await Promise.all([
          LivingAppsService.getGerichte(),
          LivingAppsService.getRestaurant(),
          LivingAppsService.getBestellungen(),
        ]);
        setGerichte(gerichteData);
        setRestaurant(restaurantData);
        setBestellungen(bestellungenData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const gerichteMap = useMemo(() => {
    const m = new Map<string, Gerichte>();
    gerichte.forEach(r => m.set(r.record_id, r));
    return m;
  }, [gerichte]);

  const restaurantMap = useMemo(() => {
    const m = new Map<string, Restaurant>();
    restaurant.forEach(r => m.set(r.record_id, r));
    return m;
  }, [restaurant]);

  return { gerichte, setGerichte, restaurant, setRestaurant, bestellungen, setBestellungen, loading, error, fetchAll, gerichteMap, restaurantMap };
}