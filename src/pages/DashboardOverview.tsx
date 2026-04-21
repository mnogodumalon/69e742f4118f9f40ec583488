import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichGerichte, enrichBestellungen } from '@/lib/enrich';
import type { EnrichedGerichte, EnrichedBestellungen } from '@/types/enriched';
import type { Restaurant } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { formatCurrency } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { IconAlertCircle, IconTool, IconRefresh, IconCheck, IconPlus, IconPencil, IconTrash, IconPhone, IconWorld, IconClock, IconShoppingCart, IconLeaf, IconX, IconChevronRight, IconBuildingStore, IconArrowRight } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { RestaurantDialog } from '@/components/dialogs/RestaurantDialog';
import { GerichteDialog } from '@/components/dialogs/GerichteDialog';
import { BestellungenDialog } from '@/components/dialogs/BestellungenDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';

const APPGROUP_ID = '69e742f4118f9f40ec583488';
const REPAIR_ENDPOINT = '/claude/build/repair';

type DialogMode =
  | { type: 'createRestaurant' }
  | { type: 'editRestaurant'; record: Restaurant }
  | { type: 'createGericht'; restaurantId?: string }
  | { type: 'editGericht'; record: EnrichedGerichte }
  | { type: 'createBestellung'; gerichtId?: string }
  | { type: 'editBestellung'; record: EnrichedBestellungen }
  | null;

const KATEGORIE_COLORS: Record<string, string> = {
  vorspeise: 'bg-amber-100 text-amber-800',
  hauptgericht: 'bg-indigo-100 text-indigo-800',
  beilage: 'bg-green-100 text-green-800',
  dessert: 'bg-pink-100 text-pink-800',
  getraenk: 'bg-sky-100 text-sky-800',
  sonstiges: 'bg-gray-100 text-gray-700',
};

export default function DashboardOverview() {
  const {
    restaurant, gerichte, bestellungen,
    restaurantMap, gerichteMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedGerichte = enrichGerichte(gerichte, { restaurantMap });
  const enrichedBestellungen = enrichBestellungen(bestellungen, { gerichteMap });

  // All hooks must be before early returns
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [selectedGerichtId, setSelectedGerichtId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string; label: string } | null>(null);
  const [view, setView] = useState<'restaurants' | 'menu' | 'bestellungen'>('restaurants');

  const selectedRestaurant = useMemo(
    () => restaurant.find(r => r.record_id === selectedRestaurantId) ?? null,
    [restaurant, selectedRestaurantId]
  );

  const menuGerichte = useMemo(
    () => enrichedGerichte.filter(g => {
      const id = extractRecordId(g.fields.restaurant_ref);
      return id === selectedRestaurantId;
    }),
    [enrichedGerichte, selectedRestaurantId]
  );

  const menuByKategorie = useMemo(() => {
    const map: Record<string, EnrichedGerichte[]> = {};
    for (const g of menuGerichte) {
      const key = g.fields.kategorie?.key ?? 'sonstiges';
      if (!map[key]) map[key] = [];
      map[key].push(g);
    }
    return map;
  }, [menuGerichte]);

  const selectedGericht = useMemo(
    () => enrichedGerichte.find(g => g.record_id === selectedGerichtId) ?? null,
    [enrichedGerichte, selectedGerichtId]
  );

  const gerichtBestellungen = useMemo(
    () => enrichedBestellungen.filter(b => {
      const id = extractRecordId(b.fields.gewaehlte_gerichte);
      return id === selectedGerichtId;
    }),
    [enrichedBestellungen, selectedGerichtId]
  );

  const allBestellungenForRestaurant = useMemo(
    () => enrichedBestellungen.filter(b => {
      const gerichtId = extractRecordId(b.fields.gewaehlte_gerichte);
      return menuGerichte.some(g => g.record_id === gerichtId);
    }),
    [enrichedBestellungen, menuGerichte]
  );

  const totalBestellungen = enrichedBestellungen.length;
  const bezahltCount = enrichedBestellungen.filter(b => b.fields.bereits_bezahlt).length;

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'restaurant') {
      await LivingAppsService.deleteRestaurantEntry(deleteTarget.id);
      if (selectedRestaurantId === deleteTarget.id) { setSelectedRestaurantId(null); setView('restaurants'); }
    } else if (deleteTarget.type === 'gericht') {
      await LivingAppsService.deleteGerichteEntry(deleteTarget.id);
      if (selectedGerichtId === deleteTarget.id) setSelectedGerichtId(null);
    } else if (deleteTarget.type === 'bestellung') {
      await LivingAppsService.deleteBestellungenEntry(deleteTarget.id);
    }
    setDeleteTarget(null);
    fetchAll();
  };

  const openRestaurantMenu = (r: Restaurant) => {
    setSelectedRestaurantId(r.record_id);
    setSelectedGerichtId(null);
    setView('menu');
  };

  const openGerichtBestellungen = (g: EnrichedGerichte) => {
    setSelectedGerichtId(g.record_id);
    setView('bestellungen');
  };

  return (
    <div className="space-y-6 pb-8">
      {/* KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="Restaurants"
          value={String(restaurant.length)}
          description="Verfügbar"
          icon={<IconBuildingStore size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Gerichte"
          value={String(gerichte.length)}
          description="In der Speisekarte"
          icon={<IconShoppingCart size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Bestellungen"
          value={String(totalBestellungen)}
          description="Insgesamt"
          icon={<IconArrowRight size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Bezahlt"
          value={String(bezahltCount)}
          description={`von ${totalBestellungen} Bestellungen`}
          icon={<IconCheck size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Breadcrumb Navigation */}
      {view !== 'restaurants' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <button onClick={() => { setView('restaurants'); setSelectedRestaurantId(null); setSelectedGerichtId(null); }} className="hover:text-foreground transition-colors font-medium">
            Restaurants
          </button>
          {selectedRestaurant && (
            <>
              <IconChevronRight size={14} className="shrink-0" />
              <button
                onClick={() => { setView('menu'); setSelectedGerichtId(null); }}
                className={`transition-colors font-medium ${view === 'menu' ? 'text-foreground' : 'hover:text-foreground'}`}
              >
                {selectedRestaurant.fields.restaurant_name ?? 'Restaurant'}
              </button>
            </>
          )}
          {view === 'bestellungen' && selectedGericht && (
            <>
              <IconChevronRight size={14} className="shrink-0" />
              <span className="text-foreground font-medium truncate">{selectedGericht.fields.gericht_name ?? 'Gericht'}</span>
            </>
          )}
        </div>
      )}

      {/* RESTAURANT LIST */}
      {view === 'restaurants' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-semibold">Restaurants</h2>
            <Button size="sm" onClick={() => setDialog({ type: 'createRestaurant' })}>
              <IconPlus size={14} className="mr-1 shrink-0" />
              Restaurant hinzufügen
            </Button>
          </div>

          {restaurant.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-dashed border-border">
              <IconBuildingStore size={40} stroke={1.5} className="text-muted-foreground" />
              <p className="text-muted-foreground text-sm">Noch keine Restaurants erfasst</p>
              <Button size="sm" variant="outline" onClick={() => setDialog({ type: 'createRestaurant' })}>
                <IconPlus size={14} className="mr-1" />Jetzt hinzufügen
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {restaurant.map(r => {
                const bestellCount = enrichedBestellungen.filter(b => {
                  const gId = extractRecordId(b.fields.gewaehlte_gerichte);
                  return enrichedGerichte.some(g => g.record_id === gId && extractRecordId(g.fields.restaurant_ref) === r.record_id);
                }).length;
                const gerichtCount = enrichedGerichte.filter(g => extractRecordId(g.fields.restaurant_ref) === r.record_id).length;

                return (
                  <div
                    key={r.record_id}
                    className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => openRestaurantMenu(r)}
                  >
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-base truncate">{r.fields.restaurant_name ?? '–'}</h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                            {r.fields.lieferzeit && (
                              <span className="flex items-center gap-1 shrink-0">
                                <IconClock size={12} />
                                {r.fields.lieferzeit} Min.
                              </span>
                            )}
                            {r.fields.mindestbestellwert != null && (
                              <span className="shrink-0">MBW: {formatCurrency(r.fields.mindestbestellwert)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                            onClick={() => setDialog({ type: 'editRestaurant', record: r })}
                          >
                            <IconPencil size={14} className="text-muted-foreground" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                            onClick={() => setDeleteTarget({ type: 'restaurant', id: r.record_id, label: r.fields.restaurant_name ?? 'Restaurant' })}
                          >
                            <IconTrash size={14} className="text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="secondary" className="text-xs">{gerichtCount} Gerichte</Badge>
                        <Badge variant="secondary" className="text-xs">{bestellCount} Bestellungen</Badge>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {r.fields.restaurant_tel && (
                          <a href={`tel:${r.fields.restaurant_tel}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors" onClick={e => e.stopPropagation()}>
                            <IconPhone size={12} />{r.fields.restaurant_tel}
                          </a>
                        )}
                        {r.fields.restaurant_url && (
                          <a href={r.fields.restaurant_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors" onClick={e => e.stopPropagation()}>
                            <IconWorld size={12} />Speisekarte
                          </a>
                        )}
                      </div>

                      <div className="pt-1 flex items-center gap-1 text-xs text-primary font-medium group-hover:gap-2 transition-all">
                        Speisekarte anzeigen <IconChevronRight size={12} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MENU VIEW */}
      {view === 'menu' && selectedRestaurant && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold truncate">{selectedRestaurant.fields.restaurant_name}</h2>
              {selectedRestaurant.fields.hinweise && (
                <p className="text-sm text-muted-foreground truncate">{selectedRestaurant.fields.hinweise}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => {
                setDialog({ type: 'createGericht', restaurantId: selectedRestaurant.record_id });
              }}>
                <IconPlus size={14} className="mr-1" />Gericht
              </Button>
              <Button size="sm" onClick={() => setDialog({ type: 'createBestellung' })}>
                <IconPlus size={14} className="mr-1" />Bestellung
              </Button>
            </div>
          </div>

          {/* Bestellungen Summary for this Restaurant */}
          {allBestellungenForRestaurant.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-medium text-sm text-indigo-900">{allBestellungenForRestaurant.length} Bestellung(en) für dieses Restaurant</p>
                  <p className="text-xs text-indigo-600 mt-0.5">
                    {allBestellungenForRestaurant.filter(b => b.fields.bereits_bezahlt).length} bezahlt
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {allBestellungenForRestaurant.slice(0, 5).map(b => (
                    <span key={b.record_id} className="text-xs bg-white border border-indigo-200 rounded-full px-2 py-0.5 text-indigo-800">
                      {b.fields.vorname} {b.fields.nachname}
                    </span>
                  ))}
                  {allBestellungenForRestaurant.length > 5 && (
                    <span className="text-xs text-indigo-600">+{allBestellungenForRestaurant.length - 5} weitere</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {menuGerichte.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-dashed border-border">
              <IconShoppingCart size={40} stroke={1.5} className="text-muted-foreground" />
              <p className="text-muted-foreground text-sm">Noch keine Gerichte erfasst</p>
              <Button size="sm" variant="outline" onClick={() => setDialog({ type: 'createGericht', restaurantId: selectedRestaurant.record_id })}>
                <IconPlus size={14} className="mr-1" />Gericht hinzufügen
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(menuByKategorie).map(([key, items]) => {
                const label = items[0].fields.kategorie?.label ?? key;
                const colorClass = KATEGORIE_COLORS[key] ?? KATEGORIE_COLORS.sonstiges;
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colorClass}`}>{label}</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {items.map(g => {
                        const bCount = enrichedBestellungen.filter(b => extractRecordId(b.fields.gewaehlte_gerichte) === g.record_id).length;
                        return (
                          <div
                            key={g.record_id}
                            className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow cursor-pointer"
                            onClick={() => openGerichtBestellungen(g)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-medium text-sm truncate">{g.fields.gericht_name ?? '–'}</h4>
                                  {g.fields.vegetarisch && <IconLeaf size={12} className="text-green-600 shrink-0" />}
                                  {g.fields.vegan && <span className="text-xs font-semibold text-green-700 shrink-0">V</span>}
                                </div>
                                {g.fields.beschreibung && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{g.fields.beschreibung}</p>
                                )}
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                  {g.fields.preis != null && (
                                    <span className="text-sm font-semibold text-primary">{formatCurrency(g.fields.preis)}</span>
                                  )}
                                  {bCount > 0 && (
                                    <Badge variant="secondary" className="text-xs">{bCount}× bestellt</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                <button
                                  className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                                  onClick={() => setDialog({ type: 'editGericht', record: g })}
                                >
                                  <IconPencil size={13} className="text-muted-foreground" />
                                </button>
                                <button
                                  className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                                  onClick={() => setDeleteTarget({ type: 'gericht', id: g.record_id, label: g.fields.gericht_name ?? 'Gericht' })}
                                >
                                  <IconTrash size={13} className="text-muted-foreground" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* BESTELLUNGEN VIEW (for a specific Gericht) */}
      {view === 'bestellungen' && selectedGericht && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold truncate">{selectedGericht.fields.gericht_name}</h2>
                {selectedGericht.fields.preis != null && (
                  <span className="text-base font-bold text-primary shrink-0">{formatCurrency(selectedGericht.fields.preis)}</span>
                )}
              </div>
              {selectedGericht.fields.beschreibung && (
                <p className="text-sm text-muted-foreground">{selectedGericht.fields.beschreibung}</p>
              )}
            </div>
            <Button size="sm" onClick={() => {
              const url = createRecordUrl(APP_IDS.GERICHTE, selectedGericht.record_id);
              setDialog({ type: 'createBestellung', gerichtId: url });
            }}>
              <IconPlus size={14} className="mr-1" />Bestellung
            </Button>
          </div>

          {gerichtBestellungen.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-dashed border-border">
              <IconShoppingCart size={40} stroke={1.5} className="text-muted-foreground" />
              <p className="text-muted-foreground text-sm">Noch keine Bestellungen für dieses Gericht</p>
              <Button size="sm" variant="outline" onClick={() => {
                const url = createRecordUrl(APP_IDS.GERICHTE, selectedGericht.record_id);
                setDialog({ type: 'createBestellung', gerichtId: url });
              }}>
                <IconPlus size={14} className="mr-1" />Jetzt bestellen
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {gerichtBestellungen.map(b => (
                <div key={b.record_id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 flex-wrap">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {(b.fields.vorname?.[0] ?? '?').toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{b.fields.vorname} {b.fields.nachname}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      {b.fields.zahlungsart && (
                        <span className="text-xs text-muted-foreground">{b.fields.zahlungsart.label}</span>
                      )}
                      {b.fields.sonderwunsch && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">· {b.fields.sonderwunsch}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {b.fields.bereits_bezahlt ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">Bezahlt</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">Offen</Badge>
                    )}
                    <button
                      className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                      onClick={() => setDialog({ type: 'editBestellung', record: b })}
                    >
                      <IconPencil size={13} className="text-muted-foreground" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                      onClick={() => setDeleteTarget({ type: 'bestellung', id: b.record_id, label: `${b.fields.vorname} ${b.fields.nachname}` })}
                    >
                      <IconTrash size={13} className="text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DIALOGS */}
      <RestaurantDialog
        open={dialog?.type === 'createRestaurant' || dialog?.type === 'editRestaurant'}
        onClose={() => setDialog(null)}
        onSubmit={async (fields) => {
          if (dialog?.type === 'editRestaurant') {
            await LivingAppsService.updateRestaurantEntry(dialog.record.record_id, fields);
          } else {
            await LivingAppsService.createRestaurantEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={dialog?.type === 'editRestaurant' ? dialog.record.fields : undefined}
        enablePhotoScan={AI_PHOTO_SCAN['Restaurant']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Restaurant']}
      />

      <GerichteDialog
        open={dialog?.type === 'createGericht' || dialog?.type === 'editGericht'}
        onClose={() => setDialog(null)}
        onSubmit={async (fields) => {
          if (dialog?.type === 'editGericht') {
            await LivingAppsService.updateGerichteEntry(dialog.record.record_id, fields);
          } else {
            await LivingAppsService.createGerichteEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={
          dialog?.type === 'editGericht'
            ? dialog.record.fields
            : dialog?.type === 'createGericht' && dialog.restaurantId
            ? { restaurant_ref: createRecordUrl(APP_IDS.RESTAURANT, dialog.restaurantId) }
            : undefined
        }
        restaurantList={restaurant}
        enablePhotoScan={AI_PHOTO_SCAN['Gerichte']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Gerichte']}
      />

      <BestellungenDialog
        open={dialog?.type === 'createBestellung' || dialog?.type === 'editBestellung'}
        onClose={() => setDialog(null)}
        onSubmit={async (fields) => {
          if (dialog?.type === 'editBestellung') {
            await LivingAppsService.updateBestellungenEntry(dialog.record.record_id, fields);
          } else {
            await LivingAppsService.createBestellungenEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={
          dialog?.type === 'editBestellung'
            ? dialog.record.fields
            : dialog?.type === 'createBestellung' && dialog.gerichtId
            ? { gewaehlte_gerichte: dialog.gerichtId }
            : undefined
        }
        gerichteList={gerichte}
        enablePhotoScan={AI_PHOTO_SCAN['Bestellungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Bestellungen']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eintrag löschen"
        description={`"${deleteTarget?.label}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) {
            setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          }
          if (content.startsWith('[DONE]')) {
            setRepairDone(true);
            setRepairing(false);
          }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) {
            setRepairFailed(true);
          }
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktieren Sie den Support.</p>}
    </div>
  );
}
