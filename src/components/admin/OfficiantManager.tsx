import OfficiantsAdmin from '@/components/culte/OfficiantsAdmin';
import { useParoisse } from '@/contexts/ParoisseContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function OfficiantManager() {
  const { paroisse } = useParoisse();
  const paroisseId = paroisse?.id ?? null;

  if (!paroisseId) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <Alert variant="destructive">
          <AlertTitle>Paroisse requise</AlertTitle>
          <AlertDescription>Veuillez selectionner une paroisse.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <OfficiantsAdmin paroisseId={paroisseId} />
    </div>
  );
}
