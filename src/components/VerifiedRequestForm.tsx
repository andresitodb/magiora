'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface VerificationData {
  imdb_url?: string;
  credit_urls?: string[];
  id_photo_url?: string;
  note?: string;
  submitted_at?: string;
  reviewed_at?: string;
  rejection_reason?: string;
}

export default function VerifiedRequestForm({
  userId,
  verified,
  verificationStatus,
  verificationData,
  onSubmit,
}: {
  userId: string;
  verified: boolean;
  verificationStatus: string;
  verificationData: VerificationData;
  onSubmit: (formData: FormData) => void;
}) {
  const [imdbUrl, setImdbUrl] = useState(verificationData.imdb_url ?? '');
  const [creditUrls, setCreditUrls] = useState<string[]>(
    verificationData.credit_urls ?? ['', '']
  );
  const [note, setNote] = useState(verificationData.note ?? '');
  const [idPhotoUrl, setIdPhotoUrl] = useState<string | null>(
    verificationData.id_photo_url ?? null
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(verificationStatus === 'rejected');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleIdUpload(file: File) {
    setUploadError(null);
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File too large — max 5MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are accepted.');
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const fileName = `${userId}/id.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('verification-docs')
        .upload(fileName, file, { upsert: true });
      if (upErr) throw upErr;
      // We can't get a public URL since the bucket is private — store the path
      setIdPhotoUrl(fileName);
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function updateCreditUrl(index: number, value: string) {
    const next = [...creditUrls];
    next[index] = value;
    setCreditUrls(next);
  }

  function addCreditField() {
    if (creditUrls.length >= 5) return;
    setCreditUrls([...creditUrls, '']);
  }

  function removeCreditField(index: number) {
    setCreditUrls(creditUrls.filter((_, i) => i !== index));
  }

  // === DISPLAY STATES ===

  // Already verified
  if (verified) {
    return (
      <div className="bg-[#FAECE7] border border-[#712B13] rounded-md p-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex w-8 h-8 bg-[#712B13] text-white rounded-full items-center justify-center text-base font-bold flex-shrink-0">
            ✓
          </span>
          <div>
            <p className="font-serif font-medium text-[#712B13]">You&apos;re verified</p>
            <p className="text-xs italic text-stone-600 font-serif">
              The ✓ badge shows next to your name across Magiora.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Pending review
  if (verificationStatus === 'pending') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
        <p className="font-serif font-medium text-amber-900 mb-1">Verification under review</p>
        <p className="text-sm italic font-serif text-amber-800">
          We&apos;re looking at your request. You&apos;ll hear back via notifications.
          {verificationData.submitted_at && (
            <> Submitted {new Date(verificationData.submitted_at).toLocaleDateString()}.</>
          )}
        </p>
      </div>
    );
  }

  // Rejected — show reason + allow re-submit
  const wasRejected = verificationStatus === 'rejected';

  // Not requested / rejected → show button to open the form
  if (!expanded) {
    return (
      <div>
        {wasRejected ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-3">
            <p className="font-serif font-medium text-red-900 mb-1">Your last request was not approved</p>
            {verificationData.rejection_reason && (
              <p className="text-sm italic font-serif text-red-800 mb-2">
                Reason: {verificationData.rejection_reason}
              </p>
            )}
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-sm text-red-900 underline italic font-serif hover:opacity-80 cursor-pointer"
            >
              Submit a new request →
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="w-full text-left bg-white border border-stone-200 rounded-md p-4 hover:border-[#712B13] cursor-pointer transition-colors group"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-serif font-medium group-hover:text-[#712B13] mb-1">
                  Apply for verified ✓
                </p>
                <p className="text-xs italic text-stone-500 font-serif leading-snug">
                  Confirm your identity and professional authenticity with an IMDb link, credit URLs, and a photo of your government ID. Verification is separate from membership and reviewed by a Magiora editor.
                </p>
              </div>
              <span className="text-stone-400 group-hover:text-[#712B13] text-lg">→</span>
            </div>
          </button>
        )}
      </div>
    );
  }

  // Form is expanded
  return (
    <form action={onSubmit} className="bg-white border border-[#712B13] rounded-md p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-serif font-medium">Apply for verified ✓</p>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs italic text-stone-500 hover:text-[#712B13] cursor-pointer font-serif"
        >
          Cancel
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">IMDb profile URL <span className="text-red-700">*</span></label>
        <input
          type="url"
          name="imdb_url"
          required
          value={imdbUrl}
          onChange={(e) => setImdbUrl(e.target.value)}
          placeholder="https://www.imdb.com/name/nm1234567/"
          className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-sm"
          autoCapitalize="none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Credit URLs <span className="text-stone-500 font-normal italic">(1-5 — Vimeo, festival page, press, etc.)</span>
        </label>
        <div className="space-y-2">
          {creditUrls.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="url"
                name="credit_url"
                value={url}
                onChange={(e) => updateCreditUrl(i, e.target.value)}
                placeholder={i === 0 ? 'https://vimeo.com/...' : 'https://...'}
                className="flex-1 px-3 py-2 border border-stone-300 rounded-md bg-white text-sm"
                autoCapitalize="none"
              />
              {creditUrls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCreditField(i)}
                  className="px-2 text-stone-400 hover:text-red-700 cursor-pointer text-sm"
                  aria-label="Remove credit"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {creditUrls.length < 5 && (
            <button
              type="button"
              onClick={addCreditField}
              className="text-xs italic font-serif text-[#712B13] hover:underline cursor-pointer"
            >
              + Add another credit
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Government ID photo <span className="text-red-700">*</span>
        </label>
        <p className="text-xs italic text-stone-500 font-serif mb-2">
          Clear photo of the front of your ID, with your name visible. Stored privately, visible only to Magiora editors during review. Max 5MB.
        </p>

        <input
          type="hidden"
          name="id_photo_url"
          value={idPhotoUrl ?? ''}
          required
        />

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleIdUpload(file);
          }}
          className="hidden"
        />

        {idPhotoUrl ? (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded">
            <span className="text-green-700 text-xl">✓</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-serif font-medium text-green-900">ID uploaded</p>
              <p className="text-xs italic font-serif text-green-700 truncate">
                {idPhotoUrl}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIdPhotoUrl(null);
                if (fileRef.current) fileRef.current.value = '';
              }}
              className="text-xs italic font-serif text-stone-500 hover:text-red-700 cursor-pointer"
            >
              Replace
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="bg-stone-800 text-white text-sm py-2 px-4 rounded-md hover:bg-stone-900 disabled:opacity-50 cursor-pointer"
          >
            {uploading ? 'Uploading…' : 'Upload ID photo'}
          </button>
        )}
        {uploadError && (
          <p className="text-xs text-red-700 mt-2">{uploadError}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Note <span className="text-stone-500 font-normal italic">(optional)</span>
        </label>
        <textarea
          name="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Anything else for the reviewer..."
          className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white text-sm font-serif"
        />
      </div>

      <div className="pt-2 border-t border-stone-200 flex items-center justify-between gap-3">
        <p className="text-xs italic text-stone-500 font-serif">
          By submitting, you allow Magiora to verify your identity.
        </p>
        <button
          type="submit"
          disabled={!idPhotoUrl || !imdbUrl || !creditUrls.some((u) => u.trim())}
          className="bg-[#712B13] text-white text-sm py-2 px-5 rounded-md font-medium hover:bg-[#4A1B0C] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
        >
          Submit request →
        </button>
      </div>
    </form>
  );
}
