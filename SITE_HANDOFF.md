# Richard Ortiz Coaching — Public Site Elevation · HANDOFF

**Branch:** `loop/site-modern` · **Status:** ✅ All 10 rows complete. `npx tsc --noEmit` clean. All 7 public pages render 200. **Not deployed — awaiting Marshall's go-live green light.**

## What changed
Same premium performance-luxury design language as the admin (Bricolage Grotesque display + Hanken Grotesk body, obsidian canvas + warm-gold ambient glow + grain, glass cards, molten-gold gradient accents, staggered `.reveal` motion). **All copy is unchanged** — design / layout / motion only.

- **Font bug fixed** — public headings used the spaced `"Inter Tight, sans-serif"` literal my admin sweep missed, so they'd lost their typeface; now on `var(--font-display)` (Bricolage).
- **Nav** — frosted glass bar + gold "R" monogram lockup (matches admin chrome).
- **Footer** — monogram lockup + glass gradient.
- **Home** — cinematic hero (gradient "Recover.", glowing badge), glass pillar/step/testimonial cards, gold-numbered steps, glowing coach-quote card, radial-lit CTA.
- **Program** (`/coaching`) — gradient hero, icon-badge pillars, glowing CTA.
- **Meet Your Coach** — portrait glow, gradient headings, glowing mission card (bio verbatim).
- **Success Stories** — gradient hero, glass story cards, glowing empty state, pill metrics.
- **Pricing** — featured tier with gold glow + gradient price + gradient "Most Popular" badge, reveal stagger, radial CTA (all prices frozen).
- **Contact** — gradient heading, icon-badge accent, glowing success state.
- **Intake** — gradient hero + gold-gradient progress bar, gold-dim option states, gradient step dots + glowing success screen (all questions/options frozen).
- **globals.css** is shared with the admin, so both surfaces now share one cohesive system.

## Content-frozen guarantee
No headline, paragraph, list item, price, feature, question, or CTA label was edited — verified page by page. Only styles, wrappers, and motion changed.

## To deploy (Marshall's call)
```
cd ~/richard-ortiz-coaching
git checkout main && git merge loop/site-modern
git push origin main          # Vercel git integration auto-builds prod (~34s)
```
(No DB changes, no migrations. The admin elevation is already live on main; this branch only touches public pages + Nav/Footer.)
