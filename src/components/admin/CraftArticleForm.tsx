'use client';

import { useState } from 'react';
import { CRAFT_CATEGORIES, type CraftArticle } from '@/lib/craft';

interface Props {
  action: (formData: FormData) => void;
  mode: 'create' | 'edit';
  article?: CraftArticle;
}

function SectionLabel({ label }: { label: string }) {
  return <p className="font-serif italic text-sm text-[#993C1D] mb-1">{label}</p>;
}

const inputClass =
  'w-full px-3 py-2 bg-white border border-stone-300 rounded-md text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#712B13]';

const textareaClass =
  'w-full px-3 py-2 bg-white border border-stone-300 rounded-md text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#712B13] font-serif text-sm leading-relaxed';

const subLabelClass = 'block text-xs uppercase tracking-wider text-stone-500 italic font-serif mb-1';

export default function CraftArticleForm({ action, mode, article }: Props) {
  const [titleEn, setTitleEn] = useState(article?.title_en ?? '');
  const [autoSlug, setAutoSlug] = useState(!article?.slug);
  const [slug, setSlug] = useState(article?.slug ?? '');

  function computeSlug(s: string): string {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);
  }

  function handleTitleEnChange(value: string) {
    setTitleEn(value);
    if (autoSlug) setSlug(computeSlug(value));
  }

  const publishAtLocal = article?.publish_at
    ? new Date(article.publish_at).toISOString().slice(0, 16)
    : new Date().toISOString().slice(0, 16);

  return (
    <form action={action} className="space-y-8">
      {mode === 'edit' && article && <input type="hidden" name="article_id" value={article.id} />}

      {/* TITLES */}
      <section className="bg-white border border-stone-200 rounded-md p-5 space-y-3">
        <SectionLabel label="Title (bilingual)" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={subLabelClass}>English</label>
            <input
              type="text"
              name="title_en"
              required
              value={titleEn}
              onChange={(e) => handleTitleEnChange(e.target.value)}
              placeholder="How to read a slate, correctly"
              className={inputClass}
            />
          </div>
          <div>
            <label className={subLabelClass}>Español</label>
            <input
              type="text"
              name="title_es"
              required
              defaultValue={article?.title_es ?? ''}
              placeholder="Cómo leer una claqueta, correctamente"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* SLUG */}
      <section className="bg-white border border-stone-200 rounded-md p-5 space-y-2">
        <SectionLabel label="URL slug" />
        <div className="flex items-center gap-3">
          <span className="text-sm text-stone-500 font-mono">/craft/</span>
          <input
            type="text"
            name="slug"
            value={slug}
            onChange={(e) => {
              setAutoSlug(false);
              setSlug(e.target.value);
            }}
            pattern="[a-z0-9-]+"
            placeholder="auto-generated from title"
            className={inputClass + ' font-mono text-sm'}
          />
        </div>
        <label className="flex items-center gap-2 text-xs italic font-serif text-stone-500 cursor-pointer mt-1">
          <input
            type="checkbox"
            checked={autoSlug}
            onChange={(e) => {
              setAutoSlug(e.target.checked);
              if (e.target.checked) setSlug(computeSlug(titleEn));
            }}
            className="accent-[#712B13]"
          />
          Auto-generate from English title
        </label>
      </section>

      {/* INTRO */}
      <section className="bg-white border border-stone-200 rounded-md p-5 space-y-3">
        <SectionLabel label="Intro (bilingual, optional)" />
        <p className="text-xs italic text-stone-500 font-serif">
          One-sentence hook shown on listing pages and at the top of the article.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <textarea
            name="intro_en"
            rows={3}
            defaultValue={article?.intro_en ?? ''}
            placeholder="English intro"
            className={textareaClass}
          />
          <textarea
            name="intro_es"
            rows={3}
            defaultValue={article?.intro_es ?? ''}
            placeholder="Intro en español"
            className={textareaClass}
          />
        </div>
      </section>

      {/* BODY */}
      <section className="bg-white border border-stone-200 rounded-md p-5 space-y-3">
        <SectionLabel label="Body (bilingual)" />
        <p className="text-xs italic text-stone-500 font-serif">
          Use double line-breaks (a blank line) to separate paragraphs.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={subLabelClass}>English</label>
            <textarea
              name="body_en"
              required
              rows={14}
              defaultValue={article?.body_en ?? ''}
              placeholder="The slate has four pieces of information..."
              className={textareaClass}
            />
          </div>
          <div>
            <label className={subLabelClass}>Español</label>
            <textarea
              name="body_es"
              required
              rows={14}
              defaultValue={article?.body_es ?? ''}
              placeholder="La claqueta tiene cuatro datos..."
              className={textareaClass}
            />
          </div>
        </div>
      </section>

      {/* META */}
      <section className="bg-white border border-stone-200 rounded-md p-5 space-y-3">
        <SectionLabel label="Metadata" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className={subLabelClass}>Category</label>
            <select
              name="category"
              defaultValue={article?.category ?? 'cinema'}
              className={inputClass + ' cursor-pointer'}
            >
              {CRAFT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label_en}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={subLabelClass}>Reading minutes</label>
            <input
              type="number"
              name="reading_minutes"
              min={1}
              max={60}
              defaultValue={article?.reading_minutes ?? 2}
              className={inputClass}
            />
          </div>
          <div>
            <label className={subLabelClass}>Status</label>
            <select
              name="status"
              defaultValue={article?.status ?? 'draft'}
              className={inputClass + ' cursor-pointer'}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </section>

      {/* COVER + PUBLISH */}
      <section className="bg-white border border-stone-200 rounded-md p-5 space-y-3">
        <SectionLabel label="Cover & schedule" />
        <div>
          <label className={subLabelClass}>Cover image URL</label>
          <input
            type="url"
            name="cover_image_url"
            defaultValue={article?.cover_image_url ?? ''}
            placeholder="https://images.unsplash.com/..."
            className={inputClass + ' text-sm'}
          />
          <p className="text-xs italic text-stone-500 font-serif mt-1">
            Recommended 1200×600. Unsplash URLs work well.
          </p>
        </div>
        <div>
          <label className={subLabelClass}>Publish at</label>
          <input
            type="datetime-local"
            name="publish_at"
            defaultValue={publishAtLocal}
            className={inputClass + ' max-w-xs'}
          />
          <p className="text-xs italic text-stone-500 font-serif mt-1">
            Future dates with status &ldquo;published&rdquo; appear as Scheduled and go live automatically.
          </p>
        </div>
      </section>

      <div className="pt-2 flex items-center justify-end">
        <button
          type="submit"
          className="bg-[#712B13] text-white py-2.5 px-8 rounded-md font-medium hover:bg-[#4A1B0C] cursor-pointer whitespace-nowrap"
        >
          {mode === 'create' ? 'Create article' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
