import type { Restaurant } from '@/types/app';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IconPencil } from '@tabler/icons-react';

interface RestaurantViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Restaurant | null;
  onEdit: (record: Restaurant) => void;
}

export function RestaurantViewDialog({ open, onClose, record, onEdit }: RestaurantViewDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Restaurant anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Restaurantname</Label>
            <p className="text-sm">{record.fields.restaurant_name ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Telefonnummer</Label>
            <p className="text-sm">{record.fields.restaurant_tel ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Website / Speisekarte</Label>
            <p className="text-sm">{record.fields.restaurant_url ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Lieferzeit (in Minuten)</Label>
            <p className="text-sm">{record.fields.lieferzeit ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mindestbestellwert (€)</Label>
            <p className="text-sm">{record.fields.mindestbestellwert ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Lieferkosten (€)</Label>
            <p className="text-sm">{record.fields.lieferkosten ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Hinweise</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.hinweise ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}