import OfficiantsAdmin from '@/components/culte/OfficiantsAdmin';
import { useParoisse } from '@/contexts/ParoisseContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useEffect } from 'react';
import { useOfficiantTitles } from '@/hooks/useOfficiantTitles';

export function OfficiantManager() {
  const { paroisse } = useParoisse();
  const paroisseId = paroisse?.id ?? null;
  const { ensureTitles } = useOfficiantTitles(paroisseId);

  useEffect(() => {
    void ensureTitles();
  }, [ensureTitles]);

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
