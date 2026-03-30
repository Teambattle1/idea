import { useState, useRef } from 'react';
import { FileUp, Globe, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { extractTextFromPdf } from '../lib/pdfExtractor';
import { extractActivityFromText, extractActivityFromHtml } from '../lib/contentExtractor';
import { Activity } from '../types';

type PartialActivity = Partial<Omit<Activity, 'id' | 'createdAt' | 'archived'>>;

const ImportSection = ({
  onImport,
}: {
  onImport: (data: PartialActivity) => void;
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported for import');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const text = await extractTextFromPdf(file);
      if (!text.trim()) {
        setError('Could not read text from PDF. Try another file.');
        setIsProcessing(false);
        return;
      }

      const extracted = extractActivityFromText(text);
      onImport(extracted);

      const fields: string[] = [];
      if (extracted.title) fields.push('title');
      if (extracted.duration) fields.push('duration');
      if (extracted.groupSize) fields.push('group size');
      if (extracted.location) fields.push('location');
      if (extracted.tags && extracted.tags.length > 0) fields.push(`${extracted.tags.length} tags`);
      if (extracted.shortDescription) fields.push('description');

      setSuccess(`Imported: ${fields.join(', ')}`);
    } catch (err: any) {
      console.error('PDF import error:', err);
      setError('Error reading PDF: ' + (err.message || 'Unknown error'));
    }

    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUrlImport = async () => {
    if (!url.trim()) return;

    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http')) {
      targetUrl = 'https://' + targetUrl;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/extract-url?url=${encodeURIComponent(targetUrl)}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      const { html } = await response.json();
      const extracted = extractActivityFromHtml(html, targetUrl);
      onImport(extracted);

      const fields: string[] = [];
      if (extracted.title) fields.push('title');
      if (extracted.duration) fields.push('duration');
      if (extracted.groupSize) fields.push('group size');
      if (extracted.location) fields.push('location');
      if (extracted.images && extracted.images.length > 0) fields.push(`${extracted.images.length} images`);
      if (extracted.tags && extracted.tags.length > 0) fields.push(`${extracted.tags.length} tags`);

      setSuccess(`Imported: ${fields.join(', ')}`);
    } catch (err: any) {
      console.error('URL import error:', err);
      setError('Could not fetch URL: ' + (err.message || 'Unknown error'));
    }

    setIsProcessing(false);
  };

  return (
    <section className="bg-gradient-to-r from-battle-orange/10 to-yellow-500/10 rounded-xl p-6 border border-battle-orange/30 space-y-4">
      <h3 className="text-white font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-yellow-400" />
        Smart Import
      </h3>
      <p className="text-xs text-gray-400">
        Upload a PDF or enter a URL — we automatically extract title, duration, group size, location and tags.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* PDF Upload */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handlePdfUpload}
            className="hidden"
            id="pdf-import"
          />
          <label
            htmlFor="pdf-import"
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg cursor-pointer transition-colors border-2 border-dashed ${
              isProcessing
                ? 'border-battle-orange/50 bg-battle-orange/10 text-battle-orange cursor-wait'
                : 'border-white/20 hover:border-battle-orange/50 text-gray-300 hover:text-white'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <FileUp className="w-5 h-5" />
                Import from PDF
              </>
            )}
          </label>
        </div>

        {/* URL Import */}
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlImport())}
            placeholder="https://example.com/activity"
            disabled={isProcessing}
            className="flex-1 bg-battle-dark border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-battle-orange text-sm disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleUrlImport}
            disabled={isProcessing || !url.trim()}
            className="px-3 py-2 bg-battle-orange/20 hover:bg-battle-orange/30 text-battle-orange rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <Globe className="w-4 h-4" />
            Fetch
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {success && (
        <div className="text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          {success}
        </div>
      )}
    </section>
  );
};

export default ImportSection;
