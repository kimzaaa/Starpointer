// src/App.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { STARS, type Star, type StarImageMeta } from "./data/stars";
import "./app.css";

type DragScrollOptions = {
  ignoreClosestSelector?: string;
  activeClassName?: string;
};

function useDragScroll<T extends HTMLElement>(
  ref: { current: T | null },
  options: DragScrollOptions = {}
) {
  const ignoreSelector = options.ignoreClosestSelector ?? null;
  const activeClass = options.activeClassName ?? "drag-scroll-active";

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let isPointerDown = false;
    let isDragActive = false;
    let suppressClick = false;
    let pointerIdentifier: number | null = null;
    let startY = 0;
    let startScrollTop = 0;
    let previousUserSelect: string | null = null;

    const beginDrag = (id: number) => {
      if (isDragActive) return;
      isDragActive = true;
      previousUserSelect = document.body.style.userSelect;
      document.body.style.userSelect = "none";
      element.classList.add(activeClass);
      try {
        element.setPointerCapture(id);
      } catch {
        // setPointerCapture is optional; ignore if unsupported
      }
    };

    const endDrag = () => {
      if (!isDragActive) return;
      if (pointerIdentifier !== null && element.hasPointerCapture?.(pointerIdentifier)) {
        try {
          element.releasePointerCapture(pointerIdentifier);
        } catch {
          // releasePointerCapture is optional; ignore if unsupported
        }
      }
      element.classList.remove(activeClass);
      if (previousUserSelect !== null) {
        document.body.style.userSelect = previousUserSelect;
        previousUserSelect = null;
      }
      isDragActive = false;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      if (event.pointerType === "mouse" && event.button !== 0) return;

      if (ignoreSelector) {
        const target = event.target as HTMLElement | null;
        if (target && target.closest(ignoreSelector)) {
          return;
        }
      }

      isPointerDown = true;
      pointerIdentifier = event.pointerId;
      startY = event.clientY;
      startScrollTop = element.scrollTop;
      suppressClick = false;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!isPointerDown || pointerIdentifier !== event.pointerId) return;

      const deltaY = event.clientY - startY;
      if (!isDragActive && Math.abs(deltaY) > 2) {
        beginDrag(event.pointerId);
      }
      if (isDragActive) {
        suppressClick = true;
        element.scrollTop = startScrollTop - deltaY;
        event.preventDefault();
      }
    };

    const finishInteraction = (event: PointerEvent) => {
      if (!isPointerDown || pointerIdentifier !== event.pointerId) return;

      if (isDragActive) {
        endDrag();
        if (suppressClick) {
          const preventClick = (clickEvent: MouseEvent) => {
            clickEvent.preventDefault();
            clickEvent.stopPropagation();
          };
          element.addEventListener("click", preventClick, true);
          setTimeout(() => {
            element.removeEventListener("click", preventClick, true);
          }, 0);
        }
      }

      isPointerDown = false;
      pointerIdentifier = null;
      suppressClick = false;
    };

    const cancelInteraction = (event: PointerEvent) => {
      if (!isPointerDown || pointerIdentifier !== event.pointerId) return;
      if (isDragActive) {
        endDrag();
      }
      isPointerDown = false;
      pointerIdentifier = null;
      suppressClick = false;
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", finishInteraction);
    element.addEventListener("pointerleave", cancelInteraction);
    element.addEventListener("pointercancel", cancelInteraction);

    return () => {
      endDrag();
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", finishInteraction);
      element.removeEventListener("pointerleave", cancelInteraction);
      element.removeEventListener("pointercancel", cancelInteraction);
    };
  }, [ref, ignoreSelector, activeClass]);
}

const hasDisplayImage = (meta?: StarImageMeta | null): meta is StarImageMeta =>
  Boolean(meta?.src && meta.src.trim().length > 0);

const initialSelected: Star | null = (() => {
  const withImage = STARS.find(star => hasDisplayImage(star.image));
  return withImage ?? (STARS[0] ?? null);
})();

const FALLBACK_IMAGE: StarImageMeta = {
  src: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=1000&q=80",
  title: "Milky Way star field",
  attribution: "Photo by Greg Rakozy on Unsplash"
};

export default function App() {
  const [night, setNight] = useState(false);
  const [selected, setSelected] = useState<Star | null>(initialSelected);
  const [pointedId, setPointedId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [imageError, setImageError] = useState(false);
  const listRef = useRef<HTMLElement | null>(null);
  const detailsRef = useRef<HTMLElement | null>(null);

  useDragScroll(listRef, { ignoreClosestSelector: ".search-bar" });
  useDragScroll(detailsRef);

  const sortedStars = useMemo(() => STARS, []);
  const filteredStars = useMemo(() => {
    if (!query.trim()) return sortedStars;
    const term = query.trim().toLowerCase();
    return sortedStars.filter(star =>
      star.name.toLowerCase().includes(term) ||
      String(star.catalogId).includes(term)
    );
  }, [query, sortedStars]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelected(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!selected) {
      const fallback =
        filteredStars.find(star => hasDisplayImage(star.image)) ??
        filteredStars[0] ??
        null;
      setSelected(fallback);
      return;
    }
    const stillVisible = filteredStars.some(star => star.id === selected.id);
    if (!stillVisible) {
      const fallback =
        filteredStars.find(star => hasDisplayImage(star.image)) ??
        filteredStars[0] ??
        null;
      setSelected(fallback);
    }
  }, [filteredStars, selected]);

  const handleSelect = (star: Star) => {
    setSelected(star);
  };

  const handlePoint = () => {
    if (!selected) return;
    setPointedId(selected.catalogId);
  };

  const imageMeta = useMemo(() => {
    const candidate = selected?.image;
    if (hasDisplayImage(candidate)) {
      return candidate;
    }
    return FALLBACK_IMAGE;
  }, [selected]);
  const resolvedImage = imageError ? FALLBACK_IMAGE : imageMeta;
  const starFacts =
    selected
      ? [
          { label: "Magnitude", value: selected.magnitude },
          { label: "Distance", value: selected.distance },
          { label: "Spectral Type", value: selected.spectralType },
          { label: "RA / Dec", value: selected.coordinates },
        ].filter(fact => Boolean(fact.value))
      : [];
  const starDescription = selected?.summary ?? selected?.description ?? "";

  useEffect(() => {
    setImageError(false);
  }, [imageMeta]);

  const handleImageError = () => {
    if (imageMeta !== FALLBACK_IMAGE) {
      setImageError(true);
    }
  };
  const imageAlt = selected
    ? `${selected.name} star imagery`
    : resolvedImage.title || "Star field imagery";
  const captionTitle = resolvedImage.title || selected?.name || FALLBACK_IMAGE.title;
  const captionAttribution =
    resolvedImage.attribution || (selected ? `Visual reference for ${selected.name}` : FALLBACK_IMAGE.attribution);

  return (
      <div className={`screen ${night ? "night" : ""}`}>
        <main className="content">
          <aside
            className="stars-list"
            aria-label="Available stars"
            ref={listRef}
          >
            <div className="search-bar">
              <span className="search-icon" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search stars by name or ID..."
                aria-label="Search stars"
              />
              {query && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  Clear
                </button>
              )}
            </div>

            {filteredStars.length === 0 && (
              <div className="empty-state">
                No stars match "{query}".
              </div>
            )}

            {filteredStars.map(star => {
              const isSelected = selected?.id === star.id;
              return (
                <button
                  key={star.id}
                  type="button"
                  className={`star-item ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelect(star)}
                >
                  <span className="star-item-name">{star.name}</span>
                  <span className="star-item-id">#{star.catalogId}</span>
                </button>
              );
            })}
          </aside>

      <section
        className="star-details"
        aria-live="polite"
        ref={detailsRef}
      >
        <figure className="details-media">
          <div className="media-frame">
            <img
              src={resolvedImage.src}
              alt={imageAlt}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={handleImageError}
            />
          </div>
          <figcaption className="media-caption">
            <strong>{captionTitle}</strong>
            <span>{captionAttribution}</span>
          </figcaption>
        </figure>
        {selected ? (
          <>
            <header className="details-header">
              <h2>{selected.name}</h2>
              {selected.aliases?.length ? (
                <div className="details-aliases">
                  Also known as {selected.aliases.join(", ")}
                    </div>
                  ) : null}
                </header>
                {starFacts.length > 0 && (
                  <ul className="details-facts">
                    {starFacts.map(fact => (
                      <li key={fact.label}>
                        <span className="fact-label">{fact.label}</span>
                        <span className="fact-value">{fact.value}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {starDescription && (
                  <p className="details-summary">{starDescription}</p>
                )}
                {selected.moreInfoUrl && (
                  <a
                    className="details-more-link"
                    href={selected.moreInfoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Read more
                  </a>
                )}
                <div className="details-actions">
                  <button className="btn" type="button" onClick={handlePoint}>
                    Point to star
                  </button>
                </div>
                {pointedId !== null && (
                  <div className="pointed-readout" role="status">
                    Pointing output: <span className="pointed-id">{pointedId}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="star-placeholder">
                <h2>Select a star</h2>
                <p>Choose a star from the list to view mission notes and catalog details.</p>
              </div>
            )}
          </section>
        </main>

        <footer className="status">
          <div className="hint">
            Pick a star to inspect | Drag to scroll the star list | <kbd>Esc</kbd> clear selection
          </div>
          <div className="status-actions">
            <button
              className={`toggle ${night ? "on" : ""}`}
              onClick={() => setNight(v => !v)}
              title="Toggle Night Filter"
              type="button"
            >
              Night Mode
            </button>
            {pointedId !== null && (
              <div className="pointed-summary">
                Last commanded ID: <strong>{pointedId}</strong>
              </div>
            )}
          </div>
        </footer>
      </div>
  );
}
//image gone when all info are placed in .json
//put this to github too
