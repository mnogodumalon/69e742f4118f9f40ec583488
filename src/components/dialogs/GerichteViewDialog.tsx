import type { Gerichte, Restaurant } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';

interface GerichteViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Gerichte | null;
  onEdit: (record: Gerichte) => void;
  restaurantList: Restaurant[];
}

export function GerichteViewDialog({ open, onClose, record, onEdit, restaurantList }: GerichteViewDialogProps) {
  function getRestaurantDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return restaurantList.find(r => r.record_id === id)?.fields.restaurant_name ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerichte anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Restaurant</Label>
            <p className="text-sm">{getRestaurantDisplayName(record.fields.restaurant_ref)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Gerichtsbezeichnung</Label>
            <p className="text-sm">{record.fields.gericht_name ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kategorie</Label>
            <Badge variant="secondary">{record.fields.kategorie?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beschreibung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.beschreibung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Preis (€)</Label>
            <p className="text-sm">{record.fields.preis ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Vegetarisch</Label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              record.fields.vegetarisch ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {record.fields.vegetarisch ? 'Ja' : 'Nein'}
            </span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Vegan</Label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              record.fields.vegan ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {record.fields.vegan ? 'Ja' : 'Nein'}
            </span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Allergene / Hinweise</Label>
            <p className="text-sm">{record.fields.allergene ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}