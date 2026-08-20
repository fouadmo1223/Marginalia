/**
 * Seeds a handful of real, well-written blog posts, seed authors, categories, and tags
 * so the homepage has genuine content to showcase. Safe to re-run — it upserts by slug
 * / username and never touches unrelated data.
 *
 * Usage: npm run seed
 */
import 'dotenv/config';
import { connectToDatabase } from '../src/lib/db';
import { User } from '../src/models/User';
import { Blog } from '../src/models/Blog';
import { Category } from '../src/models/Category';
import { Tag } from '../src/models/Tag';
import { Like } from '../src/models/Like';
import { Comment } from '../src/models/Comment';
import { Follow } from '../src/models/Follow';
import { hashPassword } from '../src/lib/crypto';
import { slugify } from '../src/lib/slugify';
import { uploadFromUrl } from '../src/lib/cloudinary';

// Uploaded to Cloudinary (not linked directly) so seed content is exactly as
// reliable as real user uploads — same CDN, same optimization, no dependency on a
// third-party placeholder service staying up. Deterministic public_id + overwrite
// means re-running the seed never re-uploads or duplicates assets. Falls back to
// linking the source URL directly if Cloudinary rejects the upload (e.g. the
// account's API key doesn't have upload permission yet) so seeding still succeeds.
let cloudinaryWarned = false;

async function cover(seed: string) {
  const sourceUrl = `https://picsum.photos/seed/${seed}/1600/900`;
  try {
    return await uploadFromUrl(sourceUrl, 'seed/covers', `seed-cover-${seed}`);
  } catch (err) {
    warnCloudinaryFallback(err);
    return { url: sourceUrl, publicId: `seed/${seed}`, width: 1600, height: 900 };
  }
}

async function avatar(username: string): Promise<string> {
  const sourceUrl = `https://picsum.photos/seed/${username}-avatar/200/200`;
  try {
    const img = await uploadFromUrl(sourceUrl, 'seed/avatars', `seed-avatar-${username}`);
    return img.url;
  } catch (err) {
    warnCloudinaryFallback(err);
    return sourceUrl;
  }
}

function warnCloudinaryFallback(err: unknown) {
  if (cloudinaryWarned) return;
  cloudinaryWarned = true;
  console.warn(
    '\nCloudinary upload failed — falling back to linking images directly instead of hosting them.\n' +
      'Check that CLOUDINARY_API_KEY has upload permission in your Cloudinary dashboard (Settings > API Keys).\n' +
      `Underlying error: ${err instanceof Error ? err.message : String(err)}\n`,
  );
}

const AUTHORS = [
  {
    username: 'elena_marsh',
    name: 'Elena Marsh',
    email: 'elena@marginalia.seed',
    bio: 'Essayist writing about attention, memory, and the built environment. Formerly an architect.',
  },
  {
    username: 'devon_oak',
    name: 'Devon Oak',
    email: 'devon@marginalia.seed',
    bio: 'Software engineer turned writer. I cover the quiet parts of building things — decisions, not demos.',
  },
  {
    username: 'nadia_cole',
    name: 'Nadia Cole',
    email: 'nadia@marginalia.seed',
    bio: 'Cultural critic. I write about food, cities, and the small rituals that hold a life together.',
  },
];

const CATEGORIES = [
  { name: 'Essays', description: 'Long-form, first-person writing.' },
  { name: 'Technology', description: 'Software, tools, and how we build.' },
  { name: 'Culture', description: 'Food, cities, and everyday life.' },
  { name: 'Design', description: 'Craft, taste, and making things well.' },
];

function p(text: string) {
  return `<p>${text}</p>`;
}

const POSTS: {
  author: string;
  category: string;
  tags: string[];
  title: string;
  excerpt: string;
  content: string;
  coverSeed: string;
}[] = [
  {
    author: 'elena_marsh',
    category: 'Essays',
    tags: ['attention', 'memory'],
    title: 'The Room Remembers Before You Do',
    excerpt: 'On walking back into a childhood house and finding that your body knew the way before your mind did.',
    coverSeed: 'room-remembers',
    content: [
      p('The hallway was narrower than I remembered, which is what everyone says, and which I never believed until I stood in it. My hand had already found the light switch before I&rsquo;d consciously decided to look for it &mdash; three inches lower than any switch in any house I&rsquo;ve lived in since, and yet my fingers went there without asking my eyes for directions.'),
      p('There is a kind of memory that doesn&rsquo;t live in the part of the brain we mean when we say &ldquo;I remember.&rdquo; It lives in the wrist, in the two steps you take before turning left, in the specific pressure required to open a door that has swollen slightly with thirty years of humid summers. Psychologists call this procedural memory, and they&rsquo;ll tell you it&rsquo;s the most durable kind &mdash; the last to go, in the cruelest cases, after names and faces have already left.'),
      '<h2>What the hallway knew</h2>',
      p('I used to think of a house as a container for memories, the way a shelf holds books you could take down and read again. But standing in that hallway, I understood it differently: the house wasn&rsquo;t storing anything. It was still, in some structural sense, teaching me how to move through it, the way it had when I was seven and the switch was at eye level.'),
      p('We talk about nostalgia as an emotion, something that happens to us. But this wasn&rsquo;t a feeling arriving from outside. It was closer to fluency &mdash; a language my body had never stopped speaking, even after decades of not needing the words.'),
      '<blockquote>Every house you have lived in is still, somewhere, telling your hands what to do.</blockquote>',
      p('I don&rsquo;t know what to do with that fact except notice it, the way you notice a word you didn&rsquo;t know you knew until it arrives, correctly, in a sentence you&rsquo;re speaking too fast to plan.'),
    ].join('\n'),
  },
  {
    author: 'elena_marsh',
    category: 'Essays',
    tags: ['cities', 'attention'],
    title: 'Nobody Looks Up in the Building They Work In',
    excerpt: 'A short case for noticing the ceiling of the room you spend the most hours of your life inside.',
    coverSeed: 'looks-up',
    content: [
      p('I asked eleven people in my office to describe the ceiling above their desk without looking. Two got the color right. None got the light fixtures right. One insisted, incorrectly and with total confidence, that there were no lights at all &mdash; that the room was lit &ldquo;from somewhere else.&rdquo;'),
      p('This isn&rsquo;t a failure of attention so much as a triumph of efficiency. The brain that notices everything is the brain that gets nothing done. We build models of our environments precisely so we can stop perceiving them and start using them &mdash; and a ceiling, once modeled, becomes invisible in the most literal sense: it stops entering awareness at all.'),
      '<h2>The cost of a good model</h2>',
      p('The trouble is that the model, once built, resists updating. The office I described above was renovated eight months before I ran my small survey. New fixtures, new paint. Nobody had noticed.'),
      p('I don&rsquo;t think this is really about ceilings. I think it&rsquo;s about how much of a life can pass underneath something we stopped looking at years ago &mdash; a habit, a relationship, a version of ourselves &mdash; simply because looking up once was enough to file it away as known.'),
    ].join('\n'),
  },
  {
    author: 'devon_oak',
    category: 'Technology',
    tags: ['software', 'decisions'],
    title: 'The Bug Was Never in the Code',
    excerpt: 'A production outage taught me that most postmortems point at the wrong layer of the stack.',
    coverSeed: 'bug-never-code',
    content: [
      p('At 2:14 a.m. our payments service started silently dropping one in every four hundred requests. No errors. No alerts. Just a slow, quiet leak that a customer noticed three days later when their invoice didn&rsquo;t match their usage.'),
      p('The postmortem template asked: <em>what code change caused this?</em> The honest answer took two weeks to find, and it wasn&rsquo;t a code change at all. It was a decision, made eleven months earlier, to let a queue retry silently instead of paging anyone &mdash; a decision that was correct on the day it was made, for a queue that, at the time, never had a reason to fail.'),
      '<h2>Decisions have a shelf life</h2>',
      p('Every system encodes the assumptions of the moment it was designed in. The retry-without-paging logic wasn&rsquo;t a mistake; it was a reasonable trade-off for a system with different traffic, different failure modes, and a different team size. What broke wasn&rsquo;t the code. It was the fact that nobody revisited the decision after the assumptions underneath it had quietly expired.'),
      p('Since then, I&rsquo;ve started attaching a note to consequential decisions: not just what we chose, but what would have to change for the choice to stop being correct. It&rsquo;s a small habit. It has already saved us once.'),
      '<blockquote>Most outages aren&rsquo;t bugs. They&rsquo;re old decisions meeting a present they weren&rsquo;t designed for.</blockquote>',
    ].join('\n'),
  },
  {
    author: 'devon_oak',
    category: 'Technology',
    tags: ['tools', 'craft'],
    title: 'Delete the Feature You Are Proudest Of',
    excerpt: 'The hardest edits are never the sloppy parts. They are the parts you worked hardest to make clever.',
    coverSeed: 'delete-feature',
    content: [
      p('I spent three weeks on a caching layer that made our search feel instant. It was, by a wide margin, the cleverest thing I had built that year &mdash; a small, self-tuning system that learned which queries to precompute based on traffic shape.'),
      p('We deleted it in April. Not because it was broken. Because it was the single largest source of confusing bugs in the codebase, and every new engineer lost a full day understanding it before they could safely touch the search path at all.'),
      '<h2>Cleverness is a cost, not just a feature</h2>',
      p('There&rsquo;s a specific kind of attachment that forms around code you had to think hard to write. It feels like craftsmanship, and sometimes it is. But cleverness has a maintenance bill that arrives monthly, charged to whoever reads the code next &mdash; and that person is very often not you.'),
      p('The replacement was a boring cache with a five-line invalidation rule. It is slower on paper. Nobody has filed a confused ticket about it since we shipped it.'),
    ].join('\n'),
  },
  {
    author: 'nadia_cole',
    category: 'Culture',
    tags: ['food', 'rituals'],
    title: 'The Ten-Minute Soup That Isn’t About the Soup',
    excerpt: 'What a lentil soup you can make in your sleep says about the difference between cooking and coping.',
    coverSeed: 'ten-minute-soup',
    content: [
      p('There is a soup I make on the worst days &mdash; the days when the idea of a recipe with more than five ingredients feels like an act of aggression. Lentils, an onion, whatever&rsquo;s wilting in the vegetable drawer, water, salt. Ten minutes of attention spread over forty minutes of simmering.'),
      p('I used to think of this as a lesser kind of cooking &mdash; the thing you do when you can&rsquo;t do the real thing. I don&rsquo;t think that anymore. I think it might be the most honest cooking I do all year, because it has no audience, no photograph, nothing to prove.'),
      '<h2>Cooking for no one</h2>',
      p('So much of how we talk about food now is performance &mdash; plating, lighting, the dish as a small public statement about who we are. The lentil soup has none of that. It exists for exactly as long as it takes to eat it, in a bowl I don&rsquo;t bother to warm, standing at the counter more often than not.'),
      p('I think every person needs one recipe like this: not a signature dish, but an anti-dish. Something that asks nothing of you except that you eat.'),
    ].join('\n'),
  },
  {
    author: 'nadia_cole',
    category: 'Culture',
    tags: ['cities', 'rituals'],
    title: 'What the Corner Store Knows About You',
    excerpt: 'On the strange intimacy of being recognized by the person who sells you your coffee.',
    coverSeed: 'corner-store',
    content: [
      p('The man who runs the store on my corner has never asked my name. He also knows, without asking, that I take my coffee black on weekdays and with milk on weekends &mdash; a distinction I never explained and am not sure I could explain, since I&rsquo;m not entirely sure it&rsquo;s true on purpose.'),
      p('This is a kind of intimacy that doesn&rsquo;t require disclosure. He doesn&rsquo;t know where I work or whether I&rsquo;m married. He knows the shape of six a.m. on a Tuesday, repeated for three years, which is its own kind of knowing &mdash; narrower than friendship, but somehow no less real.'),
      '<h2>Recognition as a form of care</h2>',
      p('I moved twice in the years I&rsquo;ve lived here, and both times the hardest part wasn&rsquo;t the apartment. It was starting over with someone who didn&rsquo;t yet know how I take my coffee &mdash; having to be, again, a stranger who has to ask for what they want out loud.'),
    ].join('\n'),
  },
  {
    author: 'devon_oak',
    category: 'Design',
    tags: ['craft', 'taste'],
    title: 'Good Taste Is Just Fast Pattern Matching',
    excerpt: 'What ten years of design reviews taught me about where "taste" actually comes from.',
    coverSeed: 'good-taste',
    content: [
      p('People talk about design taste as though it were an innate sense, something you either have or don&rsquo;t &mdash; a kind of aesthetic pitch. I don&rsquo;t think that&rsquo;s what it is. I think taste is pattern matching that has gotten fast enough to feel like instinct.'),
      p('Every designer with strong taste I&rsquo;ve worked with can also, when asked, explain exactly why a spacing value feels wrong or a color reads as cheap. The explanation is always available. It&rsquo;s just too slow to be useful in the moment, so it compresses into a gut reaction &mdash; the same way a chess grandmaster doesn&rsquo;t calculate a good move so much as recognize one.'),
      '<h2>Which means it can be learned</h2>',
      p('This is the encouraging part. If taste were innate, there would be nothing to do but envy it. Since it&rsquo;s compressed pattern recognition, it can be built the same way any pattern recognition is built: by looking at an enormous number of examples, and being told, specifically and repeatedly, which ones were good and why.'),
      '<blockquote>Nobody is born with taste. They just did the repetitions before you started counting.</blockquote>',
    ].join('\n'),
  },
  {
    author: 'nadia_cole',
    category: 'Essays',
    tags: ['memory', 'rituals'],
    title: 'On Keeping a Drawer of Things You’ll Never Use',
    excerpt: 'A defense of the junk drawer, and what it means to keep objects for reasons other than usefulness.',
    coverSeed: 'junk-drawer',
    content: [
      p('Every apartment I have ever lived in has had one drawer that doesn&rsquo;t follow the rules of the rest of the house &mdash; a drawer of dead batteries, a single earring, a hotel key card from a trip I can&rsquo;t fully remember, a rubber band ball that has been growing, very slowly, since 2019.'),
      p('The productivity advice is unanimous on this drawer: empty it. Everything in it fails the test of usefulness. And yet I have never been able to, and over the years I&rsquo;ve stopped feeling guilty about that and started paying attention to why.'),
      '<h2>Objects as timestamps</h2>',
      p('The hotel key card isn&rsquo;t useful. But it&rsquo;s a timestamp &mdash; proof that a specific version of me was in a specific city on a specific week, before I had the version of the memory I have now, back when it was still just a Tuesday. Usefulness was never the point of the drawer. The drawer is the one place in the house where objects are allowed to just have happened.'),
    ].join('\n'),
  },
  {
    author: 'devon_oak',
    category: 'Technology',
    tags: ['software', 'craft'],
    title: 'The Slowest Part of the Sprint Was Agreeing What Done Meant',
    excerpt: 'Most estimation problems are actually definition problems wearing a estimation costume.',
    coverSeed: 'sprint-done',
    content: [
      p('We missed the same deadline three sprints in a row before anyone asked the obvious question out loud: what does &ldquo;done&rdquo; actually mean for this feature? Not finished-looking. Not demo-ready. Done &mdash; the state where nobody has to think about it again.'),
      p('It turned out four people on a five-person team had four different answers, and none of them were wrong exactly, just scoped to a different job. The designer meant pixel-accurate. The backend engineer meant the happy path worked. QA meant every edge case had a test. Nobody meant all of those things at once, but everyone had been estimating as if the others agreed with them.'),
      '<h2>Estimation is a proxy fight</h2>',
      p('Once we wrote down one shared definition &mdash; ugly, overly specific, five bullet points long &mdash; our estimates got worse in the short term and far more honest in the long term. Worse, because the real scope was bigger than anyone had been quietly assuming. Honest, because we stopped negotiating deadlines and started negotiating definitions, which is a much more useful argument to have.'),
    ].join('\n'),
  },
  {
    author: 'elena_marsh',
    category: 'Essays',
    tags: ['attention', 'cities'],
    title: 'The Bench Nobody Sits On',
    excerpt: 'A meditation on a park bench angled just wrong enough that no one ever uses it.',
    coverSeed: 'empty-bench',
    content: [
      p('There is a bench in the park near my apartment that faces a hedge. Not a view, not a path, not the pond forty feet to its left where every other bench is aimed &mdash; just a hedge, close enough that sitting there means looking at leaves eighteen inches from your face.'),
      p('I have never once seen anyone sit on it. Not in three years of walking past it most mornings. It is structurally identical to every other bench in the park: same wood, same green paint, same small brass plaque nobody reads. The only variable is the twelve degrees of rotation that separate it from being useful.'),
      '<h2>Design is mostly angle</h2>',
      p('It is a strange, small proof of something I keep relearning: that the difference between a thing being used and a thing being ignored is very rarely the thing itself. It is almost always the twelve degrees nobody bothered to adjust before installing it and walking away.'),
    ].join('\n'),
  },
  {
    author: 'nadia_cole',
    category: 'Culture',
    tags: ['food', 'cities'],
    title: 'The Restaurant That Never Changed Its Menu',
    excerpt: 'What a diner that refuses to update anything taught me about the value of not improving.',
    coverSeed: 'unchanged-diner',
    content: [
      p('The diner on the corner has had the same menu, in the same laminated folders, for as long as I have been alive, according to the owner, who says this with the flat pride of a man who has been asked to explain it too many times.'),
      p('Every restaurant around it has rebranded at least twice. Farm-to-table, then small plates, then natural wine. The diner has stayed exactly, stubbornly the same, and it is now the only place in a six-block radius where you can get a meal without having to first understand what kind of restaurant you are supposed to be experiencing.'),
      '<h2>Consistency as a form of hospitality</h2>',
      p('I used to think this was a failure of ambition. Now I think it might be the opposite &mdash; a kind of discipline, choosing legibility over reinvention, so that anyone can walk in after ten years away and order exactly what they remember.'),
    ].join('\n'),
  },
  {
    author: 'devon_oak',
    category: 'Design',
    tags: ['craft', 'decisions'],
    title: 'Nobody Reads the Empty State Until It Breaks',
    excerpt: 'The most neglected screen in most products is the one that ships first and gets tested last.',
    coverSeed: 'empty-state',
    content: [
      p('Every product review I have sat through spends an hour on the happy path and ninety seconds on what a new user sees before they have any data &mdash; the empty inbox, the blank dashboard, the list with nothing in it yet. It is usually a placeholder someone wrote in five minutes eight months ago and nobody has looked at since.'),
      p('And it is, disproportionately, the screen that decides whether a new user keeps going. It is the first real content most people ever see, arriving before they have earned any of the interesting states we spent the actual design budget on.'),
      '<h2>First impressions are unstaffed</h2>',
      p('We started treating empty states as a first-class design surface instead of a fallback, and the change was not glamorous. Just clearer copy, a real example instead of grey boxes, one obvious next action. Support tickets from new users dropped by a third the month after we shipped it.'),
    ].join('\n'),
  },
  {
    author: 'nadia_cole',
    category: 'Essays',
    tags: ['rituals', 'memory'],
    title: 'The Year I Stopped Taking Photos on Vacation',
    excerpt: 'What happened to my memory of a trip once I stopped trying to document it.',
    coverSeed: 'no-photos',
    content: [
      p('I left my phone in the hotel safe for eleven days, on principle, mostly to see what would happen. What happened is that I remember that trip worse in some ways &mdash; I could not tell you the name of the restaurant with the good bread &mdash; and far better in others, in a way I have not been able to fully explain since.'),
      p('I remember the texture of a conversation with a stranger on a train platform that I never would have had if I had been holding a phone up to the window instead. I remember boredom, actual boredom, for the first time in years, and what it felt like for my mind to wander somewhere without a screen to redirect it.'),
      '<h2>Documentation is a kind of distance</h2>',
      p('I do not think photos are the enemy of memory. But I think the act of reaching for the camera, every single time, quietly asks a question &mdash; is this worth remembering? &mdash; that most moments were never built to answer, and shouldn&rsquo;t have to.'),
    ].join('\n'),
  },
];

async function upsertAuthor(input: (typeof AUTHORS)[number]) {
  const usernameLower = input.username.toLowerCase();
  const existing = await User.findOne({ usernameLower });
  if (existing) return existing;

  return User.create({
    username: input.username,
    usernameLower,
    name: input.name,
    email: input.email,
    emailLower: input.email.toLowerCase(),
    passwordHash: await hashPassword('Seed-Password-123'),
    bio: input.bio,
    avatarUrl: await avatar(input.username),
    emailVerified: true,
  });
}

async function upsertCategory(input: (typeof CATEGORIES)[number]) {
  const slug = slugify(input.name);
  const existing = await Category.findOne({ slug });
  if (existing) return existing;
  return Category.create({ name: input.name, slug, description: input.description });
}

async function upsertTag(name: string) {
  const slug = slugify(name);
  const existing = await Tag.findOne({ slug });
  if (existing) return existing;
  return Tag.create({ name, slug, usageCount: 0 });
}

async function main() {
  await connectToDatabase();

  const authorByUsername = new Map<string, Awaited<ReturnType<typeof upsertAuthor>>>();
  for (const a of AUTHORS) authorByUsername.set(a.username, await upsertAuthor(a));

  const categoryByName = new Map<string, Awaited<ReturnType<typeof upsertCategory>>>();
  for (const c of CATEGORIES) categoryByName.set(c.name, await upsertCategory(c));

  let created = 0;
  const createdBlogIds: string[] = [];

  for (const post of POSTS) {
    const slug = slugify(post.title);
    const alreadyExists = await Blog.exists({ slug });
    if (alreadyExists) continue;

    const author = authorByUsername.get(post.author)!;
    const category = categoryByName.get(post.category)!;
    const tagDocs = await Promise.all(post.tags.map(upsertTag));

    const daysAgo = Math.floor(Math.random() * 20) + 1;
    const publishedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const blog = await Blog.create({
      title: post.title,
      slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: await cover(post.coverSeed),
      author: author._id,
      categories: [category._id],
      tags: tagDocs.map((t) => t._id),
      status: 'published',
      publishedAt,
      createdAt: publishedAt,
      viewsCount: Math.floor(Math.random() * 400) + 20,
    });

    createdBlogIds.push(String(blog._id));
    created += 1;

    for (const tag of tagDocs) {
      await Tag.updateOne({ _id: tag._id }, { $inc: { usageCount: 1 } });
    }
  }

  // Cross-follow the seed authors and sprinkle a few likes so counts feel real.
  const authors = Array.from(authorByUsername.values());
  for (const follower of authors) {
    for (const following of authors) {
      if (String(follower._id) === String(following._id)) continue;
      const exists = await Follow.exists({ follower: follower._id, following: following._id });
      if (exists) continue;
      await Follow.create({ follower: follower._id, following: following._id });
      await User.updateOne({ _id: follower._id }, { $inc: { followingCount: 1 } });
      await User.updateOne({ _id: following._id }, { $inc: { followersCount: 1 } });
    }
  }

  const allBlogs = await Blog.find({ status: 'published' }).select('_id author likesCount').lean();
  for (const blog of allBlogs) {
    for (const liker of authors) {
      if (String(liker._id) === String(blog.author)) continue;
      if (Math.random() < 0.5) continue;
      const exists = await Like.exists({ blog: blog._id, user: liker._id });
      if (exists) continue;
      await Like.create({ blog: blog._id, user: liker._id });
      await Blog.updateOne({ _id: blog._id }, { $inc: { likesCount: 1 } });
    }
  }

  const COMMENTS = [
    'This is going to stick with me for a while — especially the line about procedural memory.',
    "I've thought about this exact thing but never had the words for it. Well put.",
    'Sharing this with my team. The point about decisions having a shelf life is exactly right.',
    "Wrote something similar once but you've said it better here.",
    'The last paragraph got me. Reading this again tomorrow.',
    "Didn't expect to feel this seen by an essay about a junk drawer.",
  ];

  const blogsForComments = await Blog.find({ status: 'published' }).select('_id author commentsCount').lean();
  let commentIndex = 0;
  for (const blog of blogsForComments) {
    const commenters = authors.filter((a) => String(a._id) !== String(blog.author));
    const count = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < Math.min(count, commenters.length); i += 1) {
      const exists = await Comment.exists({ blog: blog._id, author: commenters[i]._id });
      if (exists) continue;
      await Comment.create({
        blog: blog._id,
        author: commenters[i]._id,
        content: COMMENTS[commentIndex % COMMENTS.length],
      });
      commentIndex += 1;
      await Blog.updateOne({ _id: blog._id }, { $inc: { commentsCount: 1 } });
    }
  }

  console.log(`Seed complete. ${created} new blog(s) created, ${authors.length} seed authors ensured.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
