// Client success stories — real testimonials only.
export type SuccessStory = {
  slug: string
  name: string
  age?: number
  headline: string
  metrics: string[]
  story: string
  beforePhoto?: string
  afterPhoto?: string
  videoUrl?: string
}

export const successStories: SuccessStory[] = [
  {
    slug: "jessica-43",
    name: "Jessica",
    age: 43,
    headline: "More definition than in my 20s and 30s — at 43.",
    metrics: ["Fat loss", "Muscle definition", "Improved sleep", "Less inflammation"],
    story: `Since starting my protocol with Richard, I have been able to lose body fat while maintaining my muscle mass, which is my exact goal. I train consistently and eat well, but wanted to see the muscle definition I have worked so hard for. He thoughtfully put together a plan for me and it's working! Every week I have seen measurable progress at my check-ins, which is so encouraging.

Mentally, I feel more motivated to continue to put in the work and keep showing up for myself. When you see undeniable progress, it gives you a push to take it further. Physically, I feel great — improved sleep, clean energy for my workouts, less inflammation, and a reduction in body fat. Visually, I can see my body changing in the mirror. I can feel the physical changes and see them. Overall, I feel systemically regulated.

I would encourage anyone who is thinking about getting started to consider what they stand to GAIN by investing in their health. Our health is our wealth and when it's gone, not much else matters. At 43 I can honestly say that I look and feel better than I did in my 20s and 30s — and that's huge for me.`,
  },
  {
    slug: "gladys",
    name: "Gladys",
    headline: "Inflammation gone. Energy back. Mindset completely changed.",
    metrics: ["No more bloating", "Better energy", "Improved sleep", "Mental focus"],
    story: `Since starting the program, I've noticed my inflammation and bloating are completely gone. My energy levels are so much better, and I'm finally sleeping well again.

Physically, I feel the best I have in a very long time. Mentally, it has completely changed my mindset — I'm more focused, motivated, and consistent. I don't lose track or give up easily anymore, and I truly love how I feel overall.

I would tell anyone thinking about starting the program that your health is one of the best investments you can make, and you won't regret it. The support from Coach Rich throughout this journey has been amazing. He genuinely cares about your progress, and his guidance and motivation are a huge part of what keeps you going and succeeding.`,
  },
  {
    slug: "desiere",
    name: "Desiere",
    headline: "Smaller clothes, more confidence, walking into every room feeling my best.",
    metrics: ["Weight loss", "No more bloat", "More definition", "Confidence"],
    story: `Since starting the program I have experienced weight loss, no more bloat, getting to buy smaller clothes, more definition to my body, getting stronger, more energy, clear skin, and feeling more confident physically.

I've started to love dressing up for work again. I work with 130 employees and over 30 physicians — I love being back to a place where I walk into any office confident and feeling my best. My body isn't just looking better, my confidence is way better.

If you're thinking about starting the program, do it! You won't regret it. The results have been amazing for myself and all my friends doing it.`,
  },
  {
    slug: "bryan-60",
    name: "Bryan",
    age: 60,
    headline: "More definition now than at a fit 30 — strangers stop me in the gym.",
    metrics: ["Dramatic strength gains", "Muscle definition", "Mental clarity", "Goal-exceeding results"],
    story: `I started TEST/TRT one year ago and the results have been game-changing. My strength and progress in the gym have increased dramatically. My definition has really developed. My mental state has significantly benefited.

I started off in good shape with better than average definition, but was never able to achieve the body and definition I desired. Richard worked with me to determine my short and long term goals for fitness, physique, and strength. We worked together to develop additional peptide use cycles — and these have delivered goal-exceeding results.

I look back at pictures of myself at a fit 30 and I actually have more definition now. When people you don't know, of all ages, come up and tell you you look ripped or jacked — it makes all that work so worthwhile. Waking up each morning and seeing the progress in the mirror is a huge mental boost and starts every day with energy. Thank you Richard for exceptional results!`,
  },
  {
    slug: "david-59",
    name: "David",
    age: 59,
    headline: "Lighter on my feet, joints feel better, hitting the gym harder than ever.",
    metrics: ["Weight loss", "Muscle definition", "Joint relief", "Drive & determination"],
    story: `Since starting the program the main change has been my physique. As the weight came off, more muscle definition appeared — which is amazing.

I feel lighter on my feet. My joints feel better with the pounds off. Mentally, I feel that I have more drive and determination to go harder in the gym as results are showing at a rapid pace.

Do your research and ask questions. Figure out a good regimen where you can eat and hydrate effectively. Start on a low dose and work your way up. Stay focused and make sure to get into the gym even if you feel tired — the results are worth it.`,
  },
]
