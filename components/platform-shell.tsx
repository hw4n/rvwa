/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Category, ContentNode, Review, UserSummary } from "@/lib/domain";
import { LogoutButton } from "@/components/logout-button";
import { getReviewDisplayTitle } from "@/lib/review-display";
import { getReviewExplicitTitle } from "@/lib/review-display";
import { formatCompactRating } from "@/lib/review-rating";
import { Skeleton } from "@/components/ui/skeleton";

export function PlatformShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const SIDEBAR_PAGE_SIZE = 12;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const { isLoading: isAuthLoading } = useConvexAuth();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [recentReviewLimit, setRecentReviewLimit] = React.useState(SIDEBAR_PAGE_SIZE);
  const [categoryItemLimit, setCategoryItemLimit] = React.useState(SIDEBAR_PAGE_SIZE);
  const [itemReviewLimit, setItemReviewLimit] = React.useState(SIDEBAR_PAGE_SIZE);
  const sidebarScrollRef = React.useRef<HTMLDivElement | null>(null);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const categories = (useQuery("categories:list" as any) as Category[] | undefined) ?? [];
  const items = (useQuery("nodes:listIndex" as any) as ContentNode[] | undefined) ?? [];
  const recentReviews = (useQuery("reviews:listRecent" as any, { limit: recentReviewLimit }) as Review[] | undefined) ?? [];
  const pendingReviews = (useQuery("reviews:listPending" as any) as Review[] | undefined) ?? [];
  const viewerQuery = useQuery("users:viewer" as any) as UserSummary | null | undefined;
  const viewer = viewerQuery ?? null;
  const reviewId = pathname.startsWith("/r/") ? decodeRouteSegment(pathname.split("/")[2]) : "";
  const editingReviewId = pathname.startsWith("/write") ? searchParams.get("review") ?? "" : "";
  const currentReview = (useQuery("reviews:getById" as any, reviewId ? { reviewId } : "skip") as Review | null | undefined) ?? null;
  const editingReview =
    (useQuery("reviews:getById" as any, editingReviewId ? { reviewId: editingReviewId } : "skip") as Review | null | undefined) ??
    null;
  const sidebarMode = getSidebarMode(pathname, currentReview);
  const currentCategorySlug = resolveCurrentCategorySlug(pathname, searchParams, currentReview, items);
  const currentItemSlug = resolveCurrentItemSlug(pathname, searchParams, currentReview);
  const isReviewDetail = pathname.startsWith("/r/");
  const categoryView = (
    useQuery("categories:getView" as any, currentCategorySlug ? { slug: currentCategorySlug } : "skip") as
    | {
      category: Category;
      nodes: ContentNode[];
      roots: ContentNode[];
      nodeCount: number;
      reviewCount: number;
      topTags: Array<{ slug: string; count: number }>;
    }
    | null
    | undefined
  ) ?? null;
  const itemView = (
    useQuery("nodes:getView" as any, currentItemSlug ? { slug: currentItemSlug } : "skip") as
    | {
      node: ContentNode;
      category: Category | null;
      children: ContentNode[];
      trail: ContentNode[];
      reviews: Review[];
    }
    | null
    | undefined
  ) ?? null;

  const rawCategoryNodes = currentCategorySlug ? categoryView?.nodes ?? [] : [];
  const sidebarCategoryNodes: ContentNode[] =
    sidebarMode === "category"
      ? rawCategoryNodes
        .slice()
        .filter((item) => item.categorySlug === currentCategorySlug)
        .sort((a, b) => compareByNewestUpdatedAt(a, b))
      : [];
  const sidebarCategoryVisibleNodes = sidebarCategoryNodes.slice(0, categoryItemLimit);

  const sidebarItemReviews =
    sidebarMode === "item" && itemView
      ? itemView.reviews.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      : [];
  const sidebarItemVisibleReviews = sidebarItemReviews.slice(0, itemReviewLimit);
  const sidebarRecentReviews = sidebarMode === "dashboard" ? recentReviews : [];

  const sidebarReviews = sidebarMode === "item" ? sidebarItemVisibleReviews : sidebarRecentReviews;
  const hasMoreSidebarItems =
    sidebarMode === "category"
      ? sidebarCategoryNodes.length > categoryItemLimit
      : sidebarMode === "item"
        ? sidebarItemReviews.length > itemReviewLimit
        : sidebarRecentReviews.length >= recentReviewLimit;
  const pendingCount = viewer?.role === "admin" ? pendingReviews.length : 0;
  const topCrumbs = resolveTopCrumbs(pathname, searchParams, categories, items, currentReview, editingReview);
  const sidebarTopCrumbs = pathname.startsWith("/r/") ? topCrumbs.slice(0, -1) : topCrumbs;
  const authIsPending = isAuthLoading || viewerQuery === undefined;
  const showGlobalWriteButton = !authIsPending && Boolean(viewer) && !pathname.startsWith("/write");
  const globalWriteHref = currentItemSlug
    ? `/write?item=${encodeURIComponent(currentItemSlug)}`
    : currentCategorySlug
      ? `/write?category=${encodeURIComponent(currentCategorySlug)}`
      : "/write";

  React.useEffect(() => {
    if (sidebarMode === "category") {
      setCategoryItemLimit(SIDEBAR_PAGE_SIZE);
    } else if (sidebarMode === "item") {
      setItemReviewLimit(SIDEBAR_PAGE_SIZE);
    } else {
      setRecentReviewLimit(SIDEBAR_PAGE_SIZE);
    }
  }, [sidebarMode]);

  React.useEffect(() => {
    if (sidebarMode !== "category") {
      return;
    }
    setCategoryItemLimit(SIDEBAR_PAGE_SIZE);
  }, [currentCategorySlug, sidebarMode]);

  React.useEffect(() => {
    if (sidebarMode !== "item") {
      return;
    }
    setItemReviewLimit(SIDEBAR_PAGE_SIZE);
  }, [currentItemSlug, sidebarMode]);

  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, searchParamsKey]);

  React.useEffect(() => {
    if (!loadMoreRef.current || !sidebarScrollRef.current || !hasMoreSidebarItems) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          if (sidebarMode === "category") {
            setCategoryItemLimit((current) => current + SIDEBAR_PAGE_SIZE);
          } else if (sidebarMode === "item") {
            setItemReviewLimit((current) => current + SIDEBAR_PAGE_SIZE);
          } else {
            setRecentReviewLimit((current) => current + SIDEBAR_PAGE_SIZE);
          }
        }
      },
      {
        root: sidebarScrollRef.current,
        rootMargin: "120px 0px",
      }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMoreSidebarItems, sidebarMode, sidebarReviews.length]);

  const drawerNavigation = (
    <>
      <DrawerLink active={pathname === "/dashboard"} href="/dashboard" icon="history" label="최근 리뷰" />
      {!authIsPending && viewer ? <DrawerLink active={pathname.startsWith("/my-reviews")} href="/my-reviews" icon="book" label="내 리뷰" /> : null}
      {!authIsPending && viewer?.role === "admin" ? (
        <DrawerLink
          active={pathname.startsWith("/admin/reviews")}
          href="/admin/reviews"
          icon="pending_actions"
          label={pendingCount ? `검토 대기 ${pendingCount}` : "검토 대기"}
        />
      ) : null}
      {!authIsPending && viewer ? (
        <DrawerLink active={pathname.startsWith("/settings")} href="/settings" icon="settings" label="설정" />
      ) : null}
      <div className="border-t border-white/10" />
      <nav className="min-h-9 px-3 py-2 text-[11px] text-[#a2a6bb]/60">
        <Breadcrumb>
          <BreadcrumbList className="flex min-h-5 items-center gap-1 whitespace-nowrap">
            {sidebarTopCrumbs.map((crumb, index) => (
              <div className="contents" key={`${crumb.label}-${index}`}>
                <BreadcrumbItem>
                  {crumb.href ? (
                    <BreadcrumbLink asChild>
                      <Link
                        href={crumb.href}
                        className="hover:text-primary transition-colors text-[11px] max-w-40 truncate block"
                      >
                        {crumb.label}
                      </Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="text-[#e5e2e1] text-[11px] font-medium max-w-40 truncate block">
                      {crumb.label}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < sidebarTopCrumbs.length - 1 ? (
                  <BreadcrumbSeparator className="text-white/20 opacity-30">
                    <span className="mx-1">/</span>
                  </BreadcrumbSeparator>
                ) : null}
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </nav>

      <div className="space-y-0">
        <div className="space-y-0">
          {sidebarMode === "category"
            ? sidebarCategoryVisibleNodes.map((entry) => (
              <CollectionLink
                active={pathname === `/n/${entry.slug}`}
                href={`/n/${entry.slug}`}
                key={entry.id}
                title={entry.title}
              />
            ))
            : sidebarReviews.map((entry) => {
              const reviewItemHref = entry.id ? `/r/${entry.id}` : "/dashboard";
              return (
                <CollectionLink
                  active={isReviewDetail ? entry.id === reviewId : false}
                  href={reviewItemHref}
                  key={entry.id}
                  title={getReviewDisplayTitle(entry)}
                  author={entry.author?.name}
                  score={entry.rating}
                />
              );
            })}
          {hasMoreSidebarItems ? <div className="h-4" ref={loadMoreRef} /> : null}
        </div>
      </div>
    </>
  );

  const railNavigation = (
    <>
      <Link className="flex h-16 w-full items-center justify-center" href="/dashboard">
        <AppIcon className="size-6 text-primary" name="hub" strokeWidth={2.4} />
      </Link>
      <nav className="flex w-full flex-1 flex-col gap-0">
        {categories.map((category) => (
          <RailLink
            active={pathname.startsWith(`/c/${category.slug}`)}
            href={`/c/${category.slug}`}
            icon={category.icon}
            key={category.id}
            label={category.name}
          />
        ))}
      </nav>
      {!authIsPending && viewer ? (
        <div className="border-t border-white/5">
          {viewer.role === "admin" ? (
            <RailLink active={pathname.startsWith("/admin/categories/")} href="/admin/categories/new" icon="add" label="추가" />
          ) : null}
          <RailLink active={pathname.startsWith("/settings")} href="/settings" icon="settings" label="설정" />
        </div>
      ) : null}
    </>
  );

  return (
    <div className="relative flex min-h-0 h-screen flex-col overflow-hidden bg-[#0e0e0e] selection:bg-primary/20 text-[#e5e2e1]">
      <div className="flex min-h-0 w-full flex-1 overflow-hidden">
        <aside className="icon-rail-scrollbar hidden md:flex h-full w-16 shrink-0 flex-col items-stretch overflow-y-auto overflow-x-hidden border-r border-white/5 bg-[#0e0e0e]">
          {railNavigation}
        </aside>

        <aside className="hidden md:flex h-full w-60 shrink-0 flex-col border-r border-white/5 bg-[#131313]">
          <div className="flex-1 overflow-y-auto custom-scrollbar" ref={sidebarScrollRef}>
            {drawerNavigation}
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 h-14 md:h-16 w-full bg-[#0e0e0e]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 md:px-10 z-20">
          
          <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
            <Sheet onOpenChange={setMobileNavOpen} open={mobileNavOpen}>
              <SheetTrigger asChild>
                <Button
                  className="shrink-0 border-white/10 text-white md:hidden"
                  size="icon-sm"
                  variant="outline"
                >
                  <MenuIcon className="h-4 w-4" />
                  <span className="sr-only">메뉴 열기</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                className="w-[min(92vw,24rem)] border-r border-white/10 bg-[#0e0e0e] p-0 text-white"
                side="left"
              >
                <SheetTitle className="sr-only">네비게이션</SheetTitle>
                <div className="flex min-h-0 flex-1 overflow-hidden">
                  <aside className="icon-rail-scrollbar flex h-full w-14 shrink-0 flex-col items-stretch overflow-y-auto overflow-x-hidden border-r border-white/5 bg-[#0e0e0e]">
                    {railNavigation}
                  </aside>
                  <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#131313]">
                    {drawerNavigation}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <nav className="min-w-0 flex-1 overflow-hidden text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-[#c2c6d8]/50">
              <Breadcrumb>
                <BreadcrumbList className="flex-wrap gap-y-1">
                  {topCrumbs.map((crumb, index) => (
                    <div className="contents" key={`${crumb.label}-${index}`}>
                      <BreadcrumbItem>
                        {crumb.href ? (
                          <BreadcrumbLink asChild>
                            <Link href={crumb.href} className="hover:text-primary transition-colors">
                              {crumb.label}
                            </Link>
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage className="text-white font-black tracking-[0.2em]">
                            {crumb.label}
                          </BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                      {index < topCrumbs.length - 1 ? (
                        <BreadcrumbSeparator className="text-white/10 opacity-30">
                          <span className="mx-1">/</span>
                        </BreadcrumbSeparator>
                      ) : null}
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </nav>
          </div>

          <div className="flex shrink-0 flex-wrap justify-end gap-2 md:gap-3 text-muted-foreground/60">
            {authIsPending ? (
              <div className="flex items-center gap-2 md:gap-3">
                <Skeleton className="h-7 w-20 md:w-24" />
                <Skeleton className="h-4 w-12 md:w-16 border-0 bg-white/10" />
              </div>
            ) : viewer ? (
              <>
                {showGlobalWriteButton ? (
                  <Button asChild className="rounded-none bg-primary text-black hover:bg-primary/80">
                    <Link href={globalWriteHref}>리뷰 작성</Link>
                  </Button>
                ) : null}
                <LogoutButton className="rounded-none border-white/10 hover:bg-white/5">로그아웃</LogoutButton>
              </>
            ) : (
              <>
                <Button asChild className="rounded-none border-white/10 hover:bg-white/5" variant="outline">
                  <Link href="/login">로그인</Link>
                </Button>
                <Button asChild className="rounded-none border-white/10 hover:bg-white/5" variant="outline">
                  <Link href="/signup">가입</Link>
                </Button>
              </>
            )}
          </div>
        </header>
          <div className="custom-scrollbar px-4 py-6 md:px-10 md:py-10 w-full min-h-0 overflow-y-auto flex-1">{children}</div>
        </main>
      </div>
    </div>
  );
}

function resolveCurrentCategorySlug(
  pathname: string,
  searchParams: ReturnType<typeof useSearchParams>,
  currentReview: Review | null,
  items: ContentNode[]
) {
  if (pathname.startsWith("/c/")) {
    return decodeRouteSegment(pathname.split("/")[2]);
  }

  if (pathname.startsWith("/n/")) {
    const itemSlug = decodeRouteSegment(pathname.split("/")[2]);
    return items.find((item) => item.slug === itemSlug)?.categorySlug ?? "";
  }

  if (pathname.startsWith("/write")) {
    const itemSlug = searchParams.get("item") ?? "";
    return items.find((item) => item.slug === itemSlug)?.categorySlug ?? "";
  }

  if (pathname.startsWith("/r/")) {
    return currentReview?.categorySlug ?? "";
  }

  return "";
}

function resolveCurrentItemSlug(
  pathname: string,
  searchParams: ReturnType<typeof useSearchParams>,
  currentReview: Review | null
) {
  if (pathname.startsWith("/n/")) {
    return decodeRouteSegment(pathname.split("/")[2]);
  }

  if (pathname.startsWith("/write")) {
    return searchParams.get("item") ?? "";
  }

  if (pathname.startsWith("/r/")) {
    return currentReview?.nodeSlug ?? "";
  }

  return "";
}

function getSidebarMode(pathname: string, currentReview: Review | null) {
  if (pathname.startsWith("/c/")) {
    return "category";
  }

  if (pathname.startsWith("/n/")) {
    return "item";
  }

  if (pathname.startsWith("/r/") && currentReview?.nodeSlug) {
    return "item";
  }

  return "dashboard";
}

function compareByNewestUpdatedAt(left: ContentNode, right: ContentNode) {
  const leftTime = (left as ContentNode & { updatedAt?: string }).updatedAt ?? left.id;
  const rightTime = (right as ContentNode & { updatedAt?: string }).updatedAt ?? right.id;
  return rightTime.localeCompare(leftTime);
}

function decodeRouteSegment(value: string | undefined) {
  if (!value) {
    return "";
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function resolveTopCrumbs(
  pathname: string,
  searchParams: ReturnType<typeof useSearchParams>,
  categories: Category[],
  items: ContentNode[],
  currentReview: Review | null,
  editingReview: Review | null
) {
  const itemSlugFromPath = pathname.startsWith("/n/") ? decodeRouteSegment(pathname.split("/")[2]) : "";
  const itemSlugFromWrite = pathname.startsWith("/write") ? searchParams.get("item") ?? editingReview?.nodeSlug ?? "" : "";
  const item = items.find((entry) => entry.slug === itemSlugFromPath || entry.slug === itemSlugFromWrite);
  const category = item ? categories.find((entry) => entry.slug === item.categorySlug) : null;

  if (pathname === "/dashboard") {
    return [{ label: "최근 리뷰" }];
  }

  if (pathname.startsWith("/my-reviews")) {
    return [{ label: "내 리뷰" }];
  }

  if (pathname.startsWith("/settings")) {
    return [{ label: "설정" }];
  }

  if (pathname.startsWith("/login")) {
    return [{ label: "로그인" }];
  }

  if (pathname.startsWith("/signup")) {
    return [{ label: "가입" }];
  }

  if (pathname.startsWith("/admin/reviews")) {
    return [{ label: "검토" }];
  }

  if (pathname.startsWith("/admin/categories/new")) {
    return [{ label: "카테고리" }, { label: "추가" }];
  }

  if (pathname.startsWith("/admin/categories/")) {
    const categorySlug = decodeRouteSegment(pathname.split("/")[3]);
    const currentCategory = categories.find((entry) => entry.slug === categorySlug);
    return currentCategory
      ? [{ label: currentCategory.name, href: `/c/${currentCategory.slug}` }, { label: "수정" }]
      : [{ label: "카테고리" }, { label: "수정" }];
  }

  if (pathname.startsWith("/admin/nodes/new/")) {
    const categorySlug = decodeRouteSegment(pathname.split("/")[4]);
    const currentCategory = categories.find((entry) => entry.slug === categorySlug);
    return currentCategory
      ? [{ label: currentCategory.name, href: `/c/${currentCategory.slug}` }, { label: "항목 추가" }]
      : [{ label: "항목 추가" }];
  }

  if (pathname.startsWith("/admin/nodes/")) {
    const nodeSlug = decodeRouteSegment(pathname.split("/")[3]);
    const currentItem = items.find((entry) => entry.slug === nodeSlug);
    const currentCategory = currentItem ? categories.find((entry) => entry.slug === currentItem.categorySlug) : null;

    return currentCategory && currentItem
      ? [
        { label: currentCategory.name, href: `/c/${currentCategory.slug}` },
        { label: currentItem.title, href: `/n/${currentItem.slug}` },
        { label: "수정" },
      ]
      : [{ label: "항목" }, { label: "수정" }];
  }

  if (pathname.startsWith("/c/")) {
    const categorySlug = decodeRouteSegment(pathname.split("/")[2]);
    const currentCategory = categories.find((entry) => entry.slug === categorySlug);
    return [{ label: currentCategory?.name ?? "카테고리" }];
  }

  if (pathname.startsWith("/n/")) {
    return category
      ? [{ label: category.name, href: `/c/${category.slug}` }, { label: item?.title ?? "항목" }]
      : [{ label: item?.title ?? "항목" }];
  }

  if (pathname.startsWith("/write")) {
    if (item && category) {
      return [
        { label: category.name, href: `/c/${category.slug}` },
        { label: item.title, href: `/n/${item.slug}` },
        { label: editingReview ? "리뷰 수정" : "리뷰 작성" },
      ];
    }

    if (editingReview) {
      return [{ label: getReviewExplicitTitle(editingReview) || "리뷰" }, { label: "리뷰 수정" }];
    }

    return [{ label: "리뷰 작성" }];
  }

  if (pathname.startsWith("/r/")) {
    if (currentReview?.nodeSlug && currentReview.nodeTitle) {
      const currentItem = items.find((entry) => entry.slug === currentReview.nodeSlug);
      const currentCategory = currentItem ? categories.find((entry) => entry.slug === currentItem.categorySlug) : null;

      return currentCategory
        ? [
          { label: currentCategory.name, href: `/c/${currentCategory.slug}` },
          { label: currentReview.nodeTitle, href: `/n/${currentReview.nodeSlug}` },
          { label: "상세" },
        ]
        : [{ label: currentReview.nodeTitle, href: `/n/${currentReview.nodeSlug}` }, { label: "상세" }];
    }

    if (currentReview) {
      return [{ label: getReviewExplicitTitle(currentReview) || "리뷰" }, { label: "상세" }];
    }

    return [{ label: "리뷰" }, { label: "상세" }];
  }

  return [{ label: "아카이브" }];
}

function RailLink({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      className={`flex aspect-square w-full flex-col items-center justify-center gap-0.5 transition-all duration-300 rounded-none ${active ? "bg-[#1c1b1b] text-primary border-l-4 border-primary" : "text-muted-foreground/40 hover:text-primary hover:bg-[#1c1b1b]/50"}`}
      href={href}
    >
      <AppIcon className="size-5" name={icon} strokeWidth={active ? 2.6 : 2.2} />
      <span className="text-[10px] md:text-[12px] font-bold leading-none tracking-tight">{label}</span>
    </Link>
  );
}

function DrawerLink({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      className={`flex w-full items-center gap-3 px-3 py-0 min-h-11 leading-none transition-all duration-300 rounded-none ${active ? "bg-[#1c1b1b] text-primary font-bold" : "text-muted-foreground/60 hover:text-primary hover:bg-[#1c1b1b]/50"}`}
      href={href}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        <AppIcon className="size-4" name={icon} />
      </span>
      <span className="flex items-center text-xs font-bold leading-none tracking-tight">{label}</span>
    </Link>
  );
}

function CollectionLink({
  href,
  title,
  category,
  author,
  score,
  active = false,
}: {
  href: string;
  title: string;
  category?: string;
  author?: string;
  score?: number;
  active?: boolean;
}) {
  return (
    <Link
      className={`group block cursor-pointer rounded-none px-3 py-2 transition-colors duration-200 ${active ? "bg-[#1c1b1b]" : "hover:bg-[#1c1b1b]/50"
        }`}
      href={href}
    >
      <span
        className={`block truncate text-sm tracking-tight transition-colors duration-200 ${active ? "text-primary" : "text-white/70 group-hover:text-primary group-hover:opacity-100"
          }`}
      >
        {title}
      </span>
      {category ? (
        <span
          className={`block text-[10px] font-bold uppercase tracking-widest mt-1 transition-colors duration-200 ${active ? "text-primary/80" : "text-muted-foreground/60 group-hover:text-white/80"
            }`}
        >
          {category}
        </span>
      ) : null}
      {(author || typeof score === "number") ? (
        <span
          className={`mt-0.5 block text-[10px] leading-tight transition-colors duration-200 ${active ? "text-white/60" : "text-muted-foreground/55"
            }`}
        >
          {author ? <span>{author}</span> : null}
          {author && typeof score === "number" ? <span className="text-[#aeb5d5]"> · </span> : null}
          {typeof score === "number" ? <span>{formatCompactRating(score)}</span> : null}
        </span>
      ) : null}
    </Link>
  );
}
