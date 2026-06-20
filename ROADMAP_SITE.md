# Richard Ortiz Coaching — Public Site Modern Elevation Loop

Branch: `loop/site-modern` · Shares the admin's elevated design system (`globals.css`: Bricolage/Hanken, obsidian + warm-gold atmosphere, glass, gold gradients).

## Rules
- **Content is FROZEN.** Keep every headline, paragraph, list item, price, and CTA label exactly as-is. Design/layout/motion only.
- Premium SaaS / performance-luxury feel matching the admin (Linear/Whoop tier). Black + gold brand.
- Use `var(--font-display)` (Bricolage) for headings, gold-gradient (`.gold-text`) on hero accents, glass `.card`, `.reveal` motion, ambient depth.
- Verify each row with `npx tsc --noEmit`, commit, mark ✅.
- No DB, no migrations. Deploy is human-gated.

## Status: ⬜ todo · ✅ done

| # | Row | Status | Notes |
|---|-----|--------|-------|
| F | Sweep remaining `Inter Tight` font refs → var(--font-display) (fix lost headings) | ✅ | spaced variant my admin sweep missed; pdf route left (server font) |
| 1 | Nav — glass + gold monogram logo lockup + refined links, matching admin chrome | ✅ | glass blur, gold "R" mark + lockup |
| 2 | Footer — refined, glass, gold accents | ✅ | monogram lockup, glass gradient, content frozen |
| 3 | Home — cinematic hero + premium sections + staggered reveal | ✅ | content frozen verbatim; badge glow, gold-text accents, glow cards, CTA radial |
| 4 | Program (`/coaching`) — elevated layout + motion | ✅ | gradient hero, icon-badge pillars, glow CTA, reveal stagger; content frozen |
| 5 | Meet Your Coach (`/meet-your-coach`) — editorial portrait treatment | ✅ | portrait glow, gradient headings, glowing mission card, radial CTA; bio verbatim |
| 6 | Success Stories (`/success-stories`) — premium testimonial cards | ✅ | gradient hero, glass story cards + reveal, glowing empty state, pill metrics; content frozen |
| 7 | Pricing (`/pricing`) — premium plan cards, gold-accent featured tier | ✅ | featured-tier glow+gradient price+gradient badge, reveal stagger, radial CTA; prices frozen |
| 8 | Contact (`/contact`) — refined form | ✅ | gradient heading, icon-badge accent, glowing success state; content frozen |
| 9 | Intake (`/intake`) — premium multi-step form styling | ✅ | gradient hero+progress, gold-dim option states, gradient step dots + success state; questions frozen |
| 10 | Final: tsc clean, mobile pass, smoke-test all public pages 200 | ⬜ | |

## Human-gated
- Deploy: merge to main + `git push origin main` (Vercel git integration).
