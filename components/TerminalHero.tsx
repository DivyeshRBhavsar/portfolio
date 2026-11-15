'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import LuffyHead from '@/components/character/LuffyHead';
import {
  sqlEmptyLines,
  sqlErrorLines,
  sqlIdleLine,
  sqlInputLabel,
  sqlNull,
  sqlPlaceholder,
  sqlPresets,
  sqlPresetsLabel,
  sqlResultLabel,
  sqlRowCount,
  sqlRunLabel,
  sqlSuccessLines,
  sqlTablesHint,
  sqlTerminalTitle,
} from '@/components/character/luffyLines';
import { fill, pick } from '@/components/character/speech';
import { runQuery, type QueryResult, type Tables } from '@/components/home/sqlEngine';

const TALK_MS = 2200;

/**
 * "Query my experience": an interactive SQL terminal over the life story's tables
 * (career, education, toolbox). Ready-made queries or your own; the result is a real
 * table, scrolling sideways inside the terminal only. Luffy reacts to each run.
 */
export default function TerminalHero({ tables }: { tables: Tables }) {
  const inputId = useId();
  const hintId = useId();
  const [sql, setSql] = useState('');
  const [ran, setRan] = useState<{ sql: string; result: QueryResult } | null>(null);
  const [line, setLine] = useState(sqlIdleLine);
  const [talking, setTalking] = useState(false);
  const talkTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(talkTimer.current), []);

  const run = (query: string) => {
    const result = runQuery(query, tables);
    setRan({ sql: query, result });
    setLine(
      !result.ok
        ? pick(sqlErrorLines)
        : result.rows.length === 0
          ? pick(sqlEmptyLines)
          : fill(pick(sqlSuccessLines), { n: String(result.rows.length) })
    );
    setTalking(true);
    clearTimeout(talkTimer.current);
    talkTimer.current = setTimeout(() => setTalking(false), TALK_MS);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    run(sql);
  };

  const preset = (query: string) => {
    setSql(query);
    run(query);
  };

  const result = ran?.result;
  const rowCount =
    result?.ok &&
    (result.rows.length === 1 ? sqlRowCount.one : fill(sqlRowCount.other, { n: String(result.rows.length) }));

  return (
    <div>
      {/* Luffy reacts to each query. */}
      <div className="mb-4 flex items-start gap-3">
        <LuffyHead talking={talking} className="h-11 w-11" />
        <p
          aria-live="polite"
          className="rounded-2xl rounded-tl-sm border-2 border-ink bg-surface px-4 py-2.5 text-sm text-ink shadow-sticker"
        >
          {line}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border-2 border-ink bg-night shadow-sticker-red">
        <div className="flex items-center gap-1.5 border-b border-night-700 bg-night-800 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red" />
          <span className="h-2.5 w-2.5 rounded-full bg-sun" />
          <span className="h-2.5 w-2.5 rounded-full bg-night-muted" />
          <span className="ml-3 font-mono text-xs text-night-muted">{sqlTerminalTitle}</span>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div role="group" aria-label={sqlPresetsLabel} className="flex flex-wrap gap-2">
            {sqlPresets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => preset(p.sql)}
                className="min-h-10 rounded-full border border-night-muted/60 px-3 py-1.5 font-mono text-xs text-night-text transition-colors hover:border-sun hover:text-sun"
              >
                {p.label}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor={inputId} className="sr-only">
              {sqlInputLabel}
            </label>
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-night-700 bg-night-800 px-3 focus-within:border-sun">
              <span aria-hidden="true" className="font-mono text-sm text-sun">
                sql&gt;
              </span>
              <input
                id={inputId}
                value={sql}
                onChange={(e) => setSql(e.target.value)}
                placeholder={sqlPlaceholder}
                aria-describedby={hintId}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                className="min-h-11 min-w-0 flex-1 bg-transparent font-mono text-sm text-night-text placeholder:text-night-muted focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="min-h-11 rounded-lg border-2 border-sun bg-sun px-4 font-mono text-sm font-medium text-on-sun hover:brightness-105"
            >
              {sqlRunLabel}
            </button>
          </form>
          <p id={hintId} className="font-mono text-xs leading-relaxed text-night-muted">
            {sqlTablesHint}
          </p>

          {ran && (
            <div className="border-t border-night-700 pt-4">
              <p className="mb-2 overflow-x-auto whitespace-pre font-mono text-xs text-night-muted">
                <span aria-hidden="true">&gt; </span>
                {ran.sql}
              </p>
              {result && !result.ok ? (
                <p role="alert" className="font-mono text-sm text-sun">
                  {result.error}
                </p>
              ) : result && result.ok ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-max min-w-full border-collapse font-mono text-xs sm:text-sm">
                      <caption className="sr-only">
                        {sqlResultLabel}: {rowCount}
                      </caption>
                      <thead>
                        <tr>
                          {result.columns.map((c) => (
                            <th
                              key={c}
                              scope="col"
                              className="border-b border-night-700 px-3 py-2 text-left font-medium text-sun"
                            >
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.rows.map((row, i) => (
                          <tr key={i} className="border-b border-night-800">
                            {row.map((cell, j) => (
                              <td key={j} className="whitespace-nowrap px-3 py-2 text-night-text">
                                {cell ?? <span className="text-night-muted">{sqlNull}</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 font-mono text-xs text-night-muted">{rowCount}</p>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
