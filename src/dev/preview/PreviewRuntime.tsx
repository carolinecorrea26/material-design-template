import { ApplicationSessionProvider } from '../../app/ApplicationSessionContext';
import { createMemoryApplicationSessionStore, type ApplicationSessionStore } from '../../app/applicationSessionStorage';
import { ComponentContentContext } from '../../components/content/ComponentContentContext';
import { FieldDefinitionsContext } from '../../components/forms/FieldDefinitionsContext';
import { ClientIconContext } from '../../components/content/ClientIconContext';
import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert } from '@mui/material';
import { candidateMockRatingService } from '../../mock/client';
import { getPrototypeLibrary, installPrototypeLibrary, type PrototypeLibrary } from '../../domain/prototypeLibrary';

type PreviewScope = { owner: symbol; id: symbol; depth: number; sessionStore: ApplicationSessionStore };
const PreviewOwner = createContext<PreviewScope | null>(null);
type Quote = typeof candidateMockRatingService.quote;
type Layer = { id: symbol; parent: symbol | null; depth: number; library: PrototypeLibrary; quote?: Quote };
let session: { owner: symbol; previous: PrototypeLibrary | null; quote: Quote; layers: Layer[] } | null = null;

/** Application helpers have one effective Site per document. Whole-page stories
 * therefore use isolated Storybook frames; nested fixtures share that frame's owner.
 * Refuse a competing owner before it can change another preview's runtime. */
function acquire(owner: symbol, layer: Layer) {
  if (session && (session.owner !== owner || session.layers.some(row => row.parent === layer.parent && row.id !== layer.id))) return null;
  session ??= { owner, previous: getPrototypeLibrary(), quote: candidateMockRatingService.quote, layers: [] };
  const current = session;
  const apply = () => {
    installPrototypeLibrary([...current.layers].sort((a, b) => b.depth - a.depth)[0]?.library ?? current.previous);
    candidateMockRatingService.quote = [...current.layers].sort((a, b) => b.depth - a.depth).find(row => row.quote)?.quote ?? current.quote;
  };
  current.layers.push(layer);
  apply();
  return () => {
    current.layers = current.layers.filter(row => row !== layer);
    apply();
    if (!current.layers.length) session = null;
  };
}

export default function PreviewRuntime({ library, estimatedRates, quote, children }: { library: PrototypeLibrary; estimatedRates?: boolean; quote?: Quote; children: ReactNode }) {
  const inheritedOwner = useContext(PreviewOwner);
  const [localOwner] = useState(() => Symbol('preview'));
  const [localSession] = useState(createMemoryApplicationSessionStore);
  const scope = useMemo(() => ({ owner: inheritedOwner?.owner ?? localOwner, id: localOwner, depth: (inheritedOwner?.depth ?? -1) + 1, sessionStore: inheritedOwner?.sessionStore ?? localSession }), [inheritedOwner, localOwner, localSession]);
  const [installed, setInstalled] = useState<PrototypeLibrary | null>(null);
  const [conflict, setConflict] = useState(false);
  useLayoutEffect(() => {
    const release = acquire(scope.owner, { id: scope.id, parent: inheritedOwner?.id ?? null, depth: scope.depth, library, ...(quote ? { quote } : estimatedRates ? { quote: (async request => ({ mode: 'mock', premiumCents: Math.round(request.amount * 0.12), expiresAt: Date.now() + 60000, authority: 'Synthetic Storybook estimate; not an insurance quote' })) as Quote } : {}) });
    setConflict(!release);
    setInstalled(release ? library : null);
    return release ?? undefined;
  }, [library, scope, inheritedOwner, estimatedRates, quote]);
  if (conflict) return <Alert severity="error">Whole-page examples require separate preview frames. Open this example in Canvas.</Alert>;
  if (installed !== library) return null;
  const content = <PreviewOwner value={scope}><ComponentContentContext value={library.content}><FieldDefinitionsContext value={library.fields}><ClientIconContext value={library.client.branding}>{children}</ClientIconContext></FieldDefinitionsContext></ComponentContentContext></PreviewOwner>;
  return inheritedOwner ? content : <ApplicationSessionProvider store={scope.sessionStore}>{content}</ApplicationSessionProvider>;
}
