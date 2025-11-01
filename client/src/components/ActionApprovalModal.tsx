import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Calendar, FileText, Mail, Plus, UserPlus } from "lucide-react";
import { useState } from "react";

export interface PendingAction {
  id: string;
  type: 'create_lead' | 'create_task' | 'book_meeting' | 'create_invoice' | 'search_gmail' | 'request_flytter_photos' | 'job_completion';
  params: Record<string, any>;
  impact: string;
  preview: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface ActionApprovalModalProps {
  action: PendingAction | null;
  open: boolean;
  onApprove: (alwaysApprove: boolean) => void;
  onReject: () => void;
}

const ACTION_ICONS = {
  create_lead: UserPlus,
  create_task: Plus,
  book_meeting: Calendar,
  create_invoice: FileText,
  search_gmail: Mail,
  request_flytter_photos: AlertTriangle,
  job_completion: FileText,
};

const ACTION_LABELS = {
  create_lead: 'Opret Lead',
  create_task: 'Opret Opgave',
  book_meeting: 'Book Kalenderaftale',
  create_invoice: 'Opret Faktura',
  search_gmail: 'Søg i Gmail',
  request_flytter_photos: 'Anmod om Billeder',
  job_completion: 'Afslut Job',
};

const RISK_COLORS = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-red-100 text-red-800 border-red-200',
};

const RISK_LABELS = {
  low: 'Lav risiko',
  medium: 'Mellem risiko',
  high: 'Høj risiko',
};

export function ActionApprovalModal({ action, open, onApprove, onReject }: ActionApprovalModalProps) {
  const [alwaysApprove, setAlwaysApprove] = useState(false);

  if (!action) return null;

  const Icon = ACTION_ICONS[action.type];
  const label = ACTION_LABELS[action.type];
  const riskColor = RISK_COLORS[action.riskLevel];
  const riskLabel = RISK_LABELS[action.riskLevel];

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-lg">Godkend Handling</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                Friday foreslår følgende handling baseret på din besked
              </AlertDialogDescription>
            </div>
            <Badge variant="outline" className={riskColor}>
              {riskLabel}
            </Badge>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Action Type */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">Handlingstype</Label>
            <p className="text-base mt-1">{label}</p>
          </div>

          {/* Impact */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">Påvirkning</Label>
            <p className="text-sm text-gray-600 mt-1">{action.impact}</p>
          </div>

          {/* Preview */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">Forhåndsvisning</Label>
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{action.preview}</p>
            </div>
          </div>

          {/* Parameters */}
          <div>
            <Label className="text-sm font-semibold text-gray-700">Detaljer</Label>
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <pre className="text-xs font-mono overflow-x-auto">
                {JSON.stringify(action.params, null, 2)}
              </pre>
            </div>
          </div>

          {/* Always Approve Option */}
          {action.riskLevel === 'low' && (
            <div className="flex items-center space-x-2 pt-2 border-t">
              <Checkbox
                id="always-approve"
                checked={alwaysApprove}
                onCheckedChange={(checked) => setAlwaysApprove(checked as boolean)}
              />
              <Label
                htmlFor="always-approve"
                className="text-sm text-gray-600 cursor-pointer"
              >
                Godkend altid denne type handling automatisk (kun for lav risiko)
              </Label>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onReject}>
            Afvis
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onApprove(alwaysApprove)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Godkend og Udfør
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
