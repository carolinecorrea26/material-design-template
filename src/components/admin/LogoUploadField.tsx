import { useEffect, useId, useRef, useState } from 'react';
import { Box, Button, FormControl, FormHelperText, FormLabel, Stack, Typography } from '@mui/material';
import { isSiteLogo, maxSiteLogoBytes, siteLogoMimeTypes } from '../../domain/siteLogo';

export default function LogoUploadField({ label, value, onChange, required = false }: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const id = useId();
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const pending = useRef<FileReader | null>(null);
  useEffect(() => () => { pending.current?.abort(); }, []);

  function load(files: FileList | null) {
    if (!files?.length) return;
    pending.current?.abort();
    const file = files[0];
    if (files.length !== 1 || !siteLogoMimeTypes.includes(file.type) || file.size > maxSiteLogoBytes) {
      setError('Choose one PNG, JPEG, or WebP image up to 1 MB.');
      return;
    }
    setError('');
    const reader = new FileReader();
    pending.current = reader;
    reader.onload = () => {
      if (pending.current !== reader) return;
      pending.current = null;
      if (typeof reader.result !== 'string' || !isSiteLogo(reader.result)) {
        setError('This image could not be read.');
        return;
      }
      setFileName(file.name);
      onChange(reader.result);
    };
    reader.onerror = () => { setError('This image could not be read.'); };
    reader.readAsDataURL(file);
  }

  return <FormControl error={!!error} fullWidth required={required}>
    <FormLabel id={`${id}-label`}>{label}</FormLabel>
    <Stack role="group" aria-labelledby={`${id}-label`} aria-describedby={`${id}-help`} spacing={1}
      onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; setDragging(true); }}
      onDragLeave={event => { if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
      onDrop={event => { event.preventDefault(); setDragging(false); load(event.dataTransfer.files); }}
      sx={{ alignItems: 'center', border: 1, borderStyle: 'dashed', borderColor: dragging ? 'primary.main' : 'divider', borderRadius: 1, bgcolor: dragging ? 'action.hover' : 'background.paper', p: 2 }}>
      {value && <Box component="img" src={value} alt={`${label} preview`} sx={{ maxWidth: '100%', height: 56, objectFit: 'contain' }} />}
      <Typography variant="body2">{value ? fileName || 'Image uploaded' : 'Drag and drop an image here'}</Typography>
      <Stack direction="row" spacing={1}>
        <Button variant="outlined" component="label" htmlFor={id} sx={{ '&:focus-within': { outline: '2px solid', outlineOffset: 2 } }}>{value ? 'Replace' : 'Choose file'}<input id={id} type="file" aria-label={`Upload ${label}`} aria-describedby={`${id}-help`} accept={siteLogoMimeTypes.join(',')}
          onChange={event => { load(event.currentTarget.files); event.currentTarget.value = ''; }}
          style={{ position: 'absolute', width: 1, height: 1, whiteSpace: 'nowrap', overflow: 'hidden', clipPath: 'inset(50%)' }} /></Button>
        {value && <Button onClick={() => { pending.current?.abort(); setFileName(''); setError(''); onChange(''); }}>Remove</Button>}
      </Stack>
    </Stack>
    <FormHelperText id={`${id}-help`} role={error ? 'alert' : undefined}>{error || 'PNG, JPEG, or WebP. Maximum 1 MB.'}</FormHelperText>
  </FormControl>;
}
