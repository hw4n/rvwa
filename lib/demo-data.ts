import type {
  Category,
  Collection,
  ContentNode,
  Review,
  UserSummary,
} from "@/lib/domain";

export const demoUser: UserSummary = {
  id: "user-demo",
  name: "Lycoris Archive",
  email: "archive@rvwa.local",
  avatar: "",
  role: "admin",
};

export const demoCategories: Category[] = [
  {
    id: "cat-anime",
    slug: "anime",
    name: "Anime",
    description:
      "Series, multi-season works, OVAs, and individual episodes all live in the same tree.",
    icon: "sparkles",
    accent: "from-sky-500/25 via-cyan-400/10 to-transparent",
    fieldDefinitions: [],
  },
  {
    id: "cat-movie",
    slug: "movie",
    name: "Movies",
    description:
      "Single-title works stay shallow, but still inherit the same review primitives and metadata slots.",
    icon: "film",
    accent: "from-amber-500/20 via-orange-400/10 to-transparent",
    fieldDefinitions: [],
  },
  {
    id: "cat-food",
    slug: "food",
    name: "Food",
    description:
      "Restaurants are anchor nodes, dishes are child content, and tags absorb the messy cross-category edges.",
    icon: "utensils-crossed",
    accent: "from-emerald-500/20 via-lime-400/10 to-transparent",
    fieldDefinitions: [],
  },
];

export const demoNodes: ContentNode[] = [
  {
    id: "node-frieren",
    slug: "frieren-beyond-journeys-end",
    title: "Frieren: Beyond Journey's End",
    categorySlug: "anime",
    nodeType: "series",
    summary:
      "A long-tail fantasy about grief, memory, and the aftershocks of an adventure party winning too early.",
    status: "Completed",
    attributes: {
      studio: "Madhouse",
      year: 2023,
      format: ["TV", "Fantasy"],
    },
    externalRefs: [
      { type: "mal", label: "MyAnimeList", value: "52991" },
      { type: "aniList", label: "AniList", value: "154587" },
    ],
    tagSlugs: ["fantasy", "melancholy", "travel"],
  },
  {
    id: "node-frieren-s1",
    slug: "frieren-season-1",
    title: "Season 1",
    categorySlug: "anime",
    nodeType: "season",
    parentId: "node-frieren",
    summary:
      "Twenty-eight episodes that turn every detour into character archaeology.",
    status: "Released",
    attributes: {
      episodes: 28,
      cour: 2,
    },
    externalRefs: [],
    tagSlugs: ["character-study", "journey"],
  },
  {
    id: "node-frieren-ep1",
    slug: "frieren-ep1-the-end-of-adventure",
    title: "Episode 1: The Journey's End",
    categorySlug: "anime",
    nodeType: "episode",
    parentId: "node-frieren-s1",
    summary:
      "A pilot that frames the entire show as a post-victory epilogue instead of another origin story.",
    attributes: {
      runtime: "47m",
      episodeNumber: 1,
    },
    externalRefs: [],
    tagSlugs: ["pilot", "setup"],
  },
  {
    id: "node-dungeon-meshi",
    slug: "dungeon-meshi",
    title: "Dungeon Meshi",
    categorySlug: "anime",
    nodeType: "series",
    summary:
      "One of the cleanest examples of food, worldbuilding, and party comedy reinforcing each other.",
    status: "Continuing",
    attributes: {
      studio: "Trigger",
      year: 2024,
      format: ["TV", "Adventure"],
    },
    externalRefs: [{ type: "aniList", label: "AniList", value: "153518" }],
    tagSlugs: ["culinary", "party-dynamics", "comedy"],
  },
  {
    id: "node-dungeon-meshi-s1",
    slug: "dungeon-meshi-season-1",
    title: "Season 1",
    categorySlug: "anime",
    nodeType: "season",
    parentId: "node-dungeon-meshi",
    summary:
      "A season that makes recipes feel like lore notes and lore notes feel edible.",
    attributes: {
      episodes: 24,
      cour: 2,
    },
    externalRefs: [],
    tagSlugs: ["worldbuilding", "comfort"],
  },
  {
    id: "node-dungeon-meshi-ep19",
    slug: "dungeon-meshi-ep19-harbingers",
    title: "Episode 19: Harbingers",
    categorySlug: "anime",
    nodeType: "episode",
    parentId: "node-dungeon-meshi-s1",
    summary:
      "The point where the show stops pretending it is only a cooking adventure and fully reveals the rot under the floorboards.",
    attributes: {
      runtime: "24m",
      episodeNumber: 19,
    },
    externalRefs: [],
    tagSlugs: ["turning-point", "tone-shift"],
  },
  {
    id: "node-perfect-blue",
    slug: "perfect-blue",
    title: "Perfect Blue",
    categorySlug: "movie",
    nodeType: "film",
    summary:
      "Still one of the sharpest dissections of image management and audience complicity.",
    status: "Released",
    attributes: {
      director: "Satoshi Kon",
      year: 1997,
      runtime: "81m",
    },
    externalRefs: [{ type: "imdb", label: "IMDb", value: "tt0156887" }],
    tagSlugs: ["psychological", "idol", "identity"],
  },
  {
    id: "node-dune-part-two",
    slug: "dune-part-two",
    title: "Dune: Part Two",
    categorySlug: "movie",
    nodeType: "film",
    summary:
      "Massive scale, clean visual intent, and an unusually disciplined sense of momentum for a blockbuster this large.",
    status: "Released",
    attributes: {
      director: "Denis Villeneuve",
      year: 2024,
      runtime: "166m",
    },
    externalRefs: [{ type: "imdb", label: "IMDb", value: "tt15239678" }],
    tagSlugs: ["epic", "sci-fi", "spectacle"],
  },
  {
    id: "node-oku-ramen",
    slug: "oku-ramen-lab",
    title: "Oku Ramen Lab",
    categorySlug: "food",
    nodeType: "restaurant",
    summary:
      "A tiny noodle counter that treats broth like a research project and plating like a performance note.",
    status: "Open",
    attributes: {
      location: "Seoul, Mapo",
      cuisine: ["Ramen", "Mazesoba", "Small Plates"],
      gps: "37.5563,126.9236",
    },
    externalRefs: [
      { type: "map", label: "GPS", value: "37.5563,126.9236" },
      { type: "instagram", label: "Instagram", url: "https://example.com/oku" },
    ],
    tagSlugs: ["seoul", "ramen", "late-night"],
  },
  {
    id: "node-oku-shoyu",
    slug: "oku-shoyu-ramen",
    title: "Shoyu Ramen",
    categorySlug: "food",
    nodeType: "dish",
    parentId: "node-oku-ramen",
    summary:
      "High-clarity soy broth, lean oil, and a bowl that rewards attention more than volume.",
    attributes: {
      price: "11,000 KRW",
      spiceLevel: "Low",
    },
    externalRefs: [],
    tagSlugs: ["broth-forward", "soy", "precision"],
  },
  {
    id: "node-oku-mazesoba",
    slug: "oku-tonkotsu-mazesoba",
    title: "Tonkotsu Mazesoba",
    categorySlug: "food",
    nodeType: "dish",
    parentId: "node-oku-ramen",
    summary:
      "Richer, louder, and intentionally messier than the ramen menu without losing balance.",
    attributes: {
      price: "12,500 KRW",
      spiceLevel: "Medium",
    },
    externalRefs: [],
    tagSlugs: ["hearty", "mix-noodles"],
  },
  {
    id: "node-cinema-bites",
    slug: "cinema-bites",
    title: "Cinema Bites",
    categorySlug: "food",
    nodeType: "restaurant",
    summary:
      "A place that refuses to pick one cuisine, which is exactly why the tagging model matters.",
    status: "Open",
    attributes: {
      location: "Seoul, Seongsu",
      cuisine: ["Small Plates", "Pasta", "Fried Sides", "Rolls"],
    },
    externalRefs: [{ type: "map", label: "GPS", value: "37.5441,127.0557" }],
    tagSlugs: ["fusion", "group-dining", "cocktails"],
  },
  {
    id: "node-cinema-fries",
    slug: "cinema-truffle-fries",
    title: "Butter Truffle Fries",
    categorySlug: "food",
    nodeType: "dish",
    parentId: "node-cinema-bites",
    summary:
      "More of a texture and aroma play than a side dish, and the kind of thing that lives better as a child node than a tag.",
    attributes: {
      price: "9,000 KRW",
      category: "Sides",
    },
    externalRefs: [],
    tagSlugs: ["fried", "shareable", "truffle"],
  },
];

export const demoReviews: Review[] = [
  {
    id: "review-frieren-season",
    nodeId: "node-frieren-s1",
    title: "A season built like a memory walk",
    body: `## Why it works

The pacing looks relaxed until you realize each quiet stretch is doing narrative accounting. The show keeps cashing in emotional context that it planted ten episodes earlier.

## What the platform model likes here

- Reviewing the full series would blur the seasonal arc.
- Reviewing each episode only would miss how the season accumulates grief.

A season-level node is exactly the right container.`,
    rating: 9.3,
    spoiler: false,
    status: "approved",
    author: demoUser,
    createdAt: "2026-03-18T11:20:00.000Z",
    updatedAt: "2026-03-18T11:20:00.000Z",
  },
  {
    id: "review-dungeon-episode",
    nodeId: "node-dungeon-meshi-ep19",
    title: "The episode where the floor opens under the premise",
    body: `This is where the show stops being merely charming.

The food logic is still present, but now it is carrying dread instead of comfort. That tonal inversion is why episode-level reviews matter at all.`,
    rating: 8.9,
    spoiler: true,
    status: "approved",
    author: demoUser,
    createdAt: "2026-03-22T08:00:00.000Z",
    updatedAt: "2026-03-22T08:00:00.000Z",
  },
  {
    id: "review-dune-two",
    nodeId: "node-dune-part-two",
    title: "Scale without mush",
    body: `The major win here is legibility.

Even when the film goes huge, the blocking and rhythm keep scene intent obvious. A lot of expensive science fiction fails exactly there.`,
    rating: 8.7,
    spoiler: false,
    status: "approved",
    author: demoUser,
    createdAt: "2026-03-15T17:30:00.000Z",
    updatedAt: "2026-03-15T17:30:00.000Z",
  },
  {
    id: "review-oku-shoyu",
    nodeId: "node-oku-shoyu",
    title: "A bowl that rewards quiet attention",
    body: `The broth is precise, not explosive.

That makes this a good example of why dish-level reviews should exist separately from restaurant-level ones. The restaurant's identity is experimentation; this bowl's identity is restraint.`,
    rating: 9.1,
    spoiler: false,
    status: "approved",
    author: demoUser,
    createdAt: "2026-03-10T12:45:00.000Z",
    updatedAt: "2026-03-10T12:45:00.000Z",
  },
  {
    id: "review-oku-restaurant",
    nodeId: "node-oku-ramen",
    title: "A menu broad enough to break strict taxonomy",
    body: `The restaurant node exists to answer a different question than the dish nodes.

Here I care about line management, consistency, menu spread, and whether the concept hangs together. The specific bowls can split into their own reviews underneath.`,
    rating: 8.8,
    spoiler: false,
    status: "approved",
    author: demoUser,
    createdAt: "2026-03-08T09:15:00.000Z",
    updatedAt: "2026-03-08T09:15:00.000Z",
  },
];

export const demoCollections: Collection[] = [
  {
    id: "collection-quiet-worlds",
    slug: "quiet-worlds",
    title: "Quiet Worlds",
    description:
      "Works that feel soft on the surface but are doing heavy emotional lifting underneath.",
    nodeSlugs: ["frieren-beyond-journeys-end", "perfect-blue"],
  },
  {
    id: "collection-seoul-noodle-run",
    slug: "seoul-noodle-run",
    title: "Seoul Noodle Run",
    description:
      "Restaurant and dish nodes that prove food is the most chaotic content type in the system.",
    nodeSlugs: ["oku-ramen-lab", "oku-shoyu-ramen", "oku-tonkotsu-mazesoba"],
  },
];
