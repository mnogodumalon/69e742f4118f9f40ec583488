import type { Bestellungen, Gerichte } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';

interface BestellungenViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Bestellungen | null;
  onEdit: (record: Bestellungen) => void;
  gerichteList: Gerichte[];
}

export function BestellungenViewDialog({ open, onClose, record, onEdit, gerichteList }: BestellungenViewDialogProps) {
  function getGerichteDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return gerichteList.find(r => r.record_id === id)?.fields.gericht_name ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bestellungen anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Vorname</Label>
            <p className="text-sm">{record.fields.vorname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nachname</Label>
            <p className="text-sm">{record.fields.nachname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Gewählte Gerichte</Label>
            <p className="text-sm">{getGerichteDisplayName(record.fields.gewaehlte_gerichte)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Sonderwünsche / Anmerkungen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.sonderwunsch ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zahlungsart</Label>
            <Badge variant="secondary">{record.fields.zahlungsart?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bereits bezahlt</Label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              record.fields.bereits_bezahlt ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {record.fields.bereits_bezahlt ? 'Ja' : 'Nein'}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}