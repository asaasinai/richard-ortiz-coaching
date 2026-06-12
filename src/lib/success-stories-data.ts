// Client success stories. Real testimonials drop in here — no code changes
// needed. The page renders a designed empty state while this array is empty.
// NEVER add fabricated testimonials.
export type SuccessStory = {
  slug: string
  name: string            // full name or initials, per client consent
  headline: string        // e.g. "Lost 32 lbs in 16 weeks"
  metrics: string[]       // e.g. ["-32 lbs", "-9% body fat", "2x energy"]
  story: string
  beforePhoto?: string    // path under /public, with client consent
  afterPhoto?: string
  videoUrl?: string       // future enhancement — not rendered yet
}

export const successStories: SuccessStory[] = []
