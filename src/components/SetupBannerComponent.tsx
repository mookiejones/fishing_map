import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, Button, Paper, Stack } from '@mui/material';

// ── Setup banner (no API key) ─────────────────────────────────

/**
 * Full-page banner rendered in place of the map when no Google Maps API key is configured.
 * The user can enter their key and press Save (or Enter); the key is immediately persisted and applied.
 * @param onSave - Called with the trimmed key string when the user submits.
 */
function SetupBanner({ onSave }: { onSave: (key: string) => void }) {
    const [draft, setDraft] = useState('');

    return (
        <Box sx={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: 'background.default',
        }}>
            <Paper elevation={4} sx={{ p: 4, maxWidth: 480, width: '100%', mx: 2 }}>
                <Typography variant="h6" gutterBottom>Google Maps API Key Required</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Enter your Maps JavaScript API key to display the interactive map.
                    Weather and tide data are already loading in the sidebar.
                </Typography>
                <Stack direction="row" spacing={1}>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="AIzaSy…"
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && draft.trim() && onSave(draft.trim())}
                    />
                    <Button
                        variant="contained"
                        disabled={!draft.trim()}
                        onClick={() => onSave(draft.trim())}
                    >
                        Save
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
}


export default SetupBanner;