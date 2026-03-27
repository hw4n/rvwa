import { ReviewSubmissionForm } from "@/components/review-submission-form";
import { requireViewer } from "@/lib/auth";
import { getCategories, getItemIndex, getReviewById } from "@/lib/repository";
import { redirect } from "next/navigation";

function decodeRouteSegment(value: string | undefined | string[]) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) {
    return "";
  }

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default async function WritePage({
  searchParams,
}: {
  searchParams: Promise<{
    item?: string | string[] | undefined;
    category?: string | string[] | undefined;
    review?: string | string[] | undefined;
  }>;
}) {
  const viewer = await requireViewer();

  const params = await searchParams;
  const initialItemSlug = decodeRouteSegment(params.item);
  const initialCategorySlug = decodeRouteSegment(params.category);
  const reviewId = Array.isArray(params.review) ? params.review[0] : params.review;
  const [categories, items, initialReview] = await Promise.all([
    getCategories(),
    getItemIndex(),
    reviewId ? getReviewById(reviewId) : Promise.resolve(null),
  ]);

  if (initialReview && initialReview.author?.id !== viewer.id) {
    redirect(`/r/${initialReview.id}`);
  }

  const resolvedItemSlug = initialReview?.nodeSlug ?? initialItemSlug;

  return (
    <div className="h-full min-h-0">
      <ReviewSubmissionForm
        categories={categories}
        initialCategorySlug={initialReview?.selectedCategorySlug ?? initialCategorySlug}
        initialItemSlug={resolvedItemSlug}
        initialReview={initialReview}
        items={items}
      />
    </div>
  );
}
