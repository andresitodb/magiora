'use client';

import { useState, useRef, useEffect } from 'react';

// Curated catalog ~150 skills across 12 categories.
const SKILL_CATEGORIES: Record<string, string[]> = {
  'Acting Technique': [
    'Meisner', 'Stanislavski', 'Strasberg', 'Hagen', 'Adler', 'Chekhov',
    'Method Acting', 'Improv', 'Cold Reading', 'Voice & Speech', 'Scene Study',
  ],
  Dance: [
    'Ballet', 'Contemporary', 'Hip Hop', 'Salsa', 'Tango', 'Jazz Dance',
    'Tap', 'Modern', 'Bachata', 'Afro-Latin', 'Breakdance',
  ],
  Music: [
    'Singing', 'Piano', 'Guitar', 'Drums', 'Bass', 'Violin',
    'Songwriting', 'Music Production', 'Beatboxing', 'DJing',
  ],
  Combat: [
    'Stage Combat', 'Stunt Work', 'Boxing', 'Brazilian Jiu-Jitsu', 'Karate',
    'Krav Maga', 'Sword Fighting', 'Fencing', 'Muay Thai',
  ],
  Languages: [
    'English (Native)', 'Spanish (Native)', 'English (Fluent)', 'Spanish (Fluent)',
    'French', 'Italian', 'Portuguese', 'Mandarin', 'Japanese',
  ],
  Accents: [
    'American (Standard)', 'British (RP)', 'British (Cockney)', 'Southern US',
    'New York', 'Boston', 'Spanish (Argentine)', 'Spanish (Mexican)',
    'Spanish (Cuban)', 'Spanish (Castilian)', 'Italian', 'Russian',
  ],
  Sports: [
    'Soccer', 'Basketball', 'Tennis', 'Swimming', 'Yoga', 'Rock Climbing',
    'Surfing', 'Skateboarding', 'Horseback Riding', 'Skiing', 'Cycling',
  ],
  'Camera & Lighting': [
    'ARRI Alexa', 'RED', 'Sony FX series', 'Blackmagic', 'Steadicam', 'Gimbal Op',
    'DIT', 'Color Grading', 'Lighting Design', 'Gaffer', 'Grip',
  ],
  Editing: [
    'Premiere Pro', 'Final Cut Pro', 'DaVinci Resolve', 'Avid Media Composer',
    'After Effects', 'Sound Editing', 'Color Correction',
  ],
  Production: [
    'Line Producing', 'Production Management', 'Budgeting', 'Scheduling',
    'Casting', 'Location Scouting', '1st AD', '2nd AD', 'Script Supervising',
  ],
  Sound: [
    'Boom Op', 'Sound Mixing', 'Sound Design', 'Foley', 'ADR', 'Pro Tools',
    'Field Recording',
  ],
  Other: [
    'Driving (Manual)', 'Motorcycle', 'Improvisation', 'Public Speaking',
    'Photography', 'Writing', 'Storyboarding', 'Painting', 'Sign Language',
  ],
};

const ALL_SKILLS = Object.values(SKILL_CATEGORIES).flat();

export default function SkillsAutocomplete({
  defaultValue,
  maxAllowed,
}: {
  defaultValue: string[];
  maxAllowed?: number;
}) {
  const [skills, setSkills] = useState<string[]>(defaultValue);
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const atLimit = maxAllowed !== undefined && skills.length >= maxAllowed;

  const suggestions = input.trim()
    ? ALL_SKILLS.filter(
        (s) =>
          s.toLowerCase().includes(input.toLowerCase()) && !skills.includes(s)
      ).slice(0, 8)
    : [];

  function addSkill(skill: string) {
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (skills.includes(trimmed)) return;
    if (atLimit) return;
    setSkills([...skills, trimmed]);
    setInput('');
  }

  function removeSkill(skill: string) {
    setSkills(skills.filter((s) => s !== skill));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        addSkill(suggestions[0]);
      } else if (input.trim()) {
        addSkill(input.trim());
      }
    } else if (e.key === 'Backspace' && !input && skills.length > 0) {
      setSkills(skills.slice(0, -1));
    }
  }

  return (
    <div ref={wrapperRef}>
      {skills.map((s) => (
        <input key={s} type="hidden" name="skills" value={s} />
      ))}

      <div
        className={`flex flex-wrap items-center gap-2 px-3 py-2 border rounded-md bg-white min-h-[44px] cursor-text ${
          atLimit ? 'border-amber-300' : 'border-stone-300'
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {skills.map((s) => (
          <span
            key={s}
            className="bg-[#FAECE7] text-[#712B13] text-xs px-2 py-1 rounded-full flex items-center gap-1.5"
          >
            {s}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeSkill(s);
              }}
              className="text-[#712B13] hover:text-red-700 cursor-pointer"
              aria-label={`Remove ${s}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={skills.length === 0 ? 'Type a skill and press Enter…' : ''}
          disabled={atLimit}
          className="flex-1 min-w-[140px] outline-none text-sm bg-transparent disabled:opacity-50"
        />
      </div>

      {atLimit && (
        <p className="text-xs italic text-amber-700 font-serif mt-1">
          You&apos;ve reached the limit of {maxAllowed} skills. Remove one to add another.
        </p>
      )}

      {showSuggestions && suggestions.length > 0 && !atLimit && (
        <div className="relative">
          <div className="absolute z-10 left-0 right-0 mt-1 max-h-64 overflow-y-auto border border-stone-200 rounded-md bg-white shadow-lg">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addSkill(s)}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-[#FAECE7] cursor-pointer font-serif"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
