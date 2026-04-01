/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useConvexAuth, usePaginatedQuery, useQuery } from "convex/react";
import Link from "next/link";
import { MenuIcon, SearchIcon } from "lucide-react";
import { AppIcon } from "@/components/app-icon";
import { useContentNodePicker } from "@/components/content-node-picker";
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
import { api } from "@/convex/_generated/api";
import type { Category, ContentNode, Review, UserSummary } from "@/lib/domain";
import { getReviewDisplayTitle } from "@/lib/review-display";
import { getReviewExplicitTitle } from "@/lib/review-display";
import { formatCompactRating } from "@/lib/review-rating";

export function PlatformShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const WRITE_BUTTON_LABEL = "새 리뷰 작성";
  const SIDEBAR_PAGE_SIZE = 12;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const { isLoading: isAuthLoading } = useConvexAuth();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [categoryItemLimit, setCategoryItemLimit] = React.useState(SIDEBAR_PAGE_SIZE);
  const [itemReviewLimit, setItemReviewLimit] = React.useState(SIDEBAR_PAGE_SIZE);
  const preserveMobileNavOnRouteChangeRef = React.useRef(false);
  const sidebarScrollRef = React.useRef<HTMLDivElement | null>(null);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);
  const categories = (useQuery("categories:list" as any) as Category[] | undefined) ?? [];
  const items = (useQuery("nodes:listIndex" as any) as ContentNode[] | undefined) ?? [];
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
  const {
    results: recentSidebarResults,
    status: recentSidebarStatus,
    loadMore: loadMoreRecentSidebar,
  } = usePaginatedQuery(
    api.reviews.listRecentPage,
    sidebarMode === "dashboard" ? {} : "skip",
    { initialNumItems: SIDEBAR_PAGE_SIZE }
  );
  const {
    results: mySidebarResults,
    status: mySidebarStatus,
    loadMore: loadMoreMySidebar,
  } = usePaginatedQuery(
    api.reviews.listMinePage,
    !isAuthLoading && sidebarMode === "mine" ? {} : "skip",
    { initialNumItems: SIDEBAR_PAGE_SIZE }
  );
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
  const sidebarRecentReviews = sidebarMode === "dashboard" ? recentSidebarResults as Review[] : [];
  const sidebarMyReviews = sidebarMode === "mine" ? mySidebarResults as Review[] : [];
  const sidebarPendingReviews = sidebarMode === "pending" ? pendingReviews : [];
  const sidebarSettingsReviews: Review[] = sidebarMode === "settings" ? [] : [];

  const sidebarReviews =
    sidebarMode === "item"
      ? sidebarItemVisibleReviews
      : sidebarMode === "mine"
        ? sidebarMyReviews
        : sidebarMode === "pending"
          ? sidebarPendingReviews
          : sidebarMode === "settings"
            ? sidebarSettingsReviews
            : sidebarRecentReviews;
  const hasMoreSidebarItems =
    sidebarMode === "category"
      ? sidebarCategoryNodes.length > categoryItemLimit
      : sidebarMode === "item"
        ? sidebarItemReviews.length > itemReviewLimit
        : sidebarMode === "mine"
          ? mySidebarStatus === "CanLoadMore"
          : sidebarMode === "pending"
            ? false
            : sidebarMode === "settings"
              ? false
              : recentSidebarStatus === "CanLoadMore";
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
    if (preserveMobileNavOnRouteChangeRef.current) {
      preserveMobileNavOnRouteChangeRef.current = false;
      return;
    }

    setMobileNavOpen(false);
  }, [pathname, searchParamsKey]);

  React.useEffect(() => {
    if (!loadMoreRef.current || !sidebarScrollRef.current || !hasMoreSidebarItems) {
      return;
    }

    let wasIntersecting = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = Boolean(entries[0]?.isIntersecting);
        if (isIntersecting && !wasIntersecting) {
          if (sidebarMode === "category") {
            setCategoryItemLimit((current) => current + SIDEBAR_PAGE_SIZE);
          } else if (sidebarMode === "item") {
            setItemReviewLimit((current) => current + SIDEBAR_PAGE_SIZE);
          } else if (sidebarMode === "mine") {
            if (mySidebarStatus === "CanLoadMore") {
              loadMoreMySidebar(SIDEBAR_PAGE_SIZE);
            }
          } else if (sidebarMode === "dashboard") {
            if (recentSidebarStatus === "CanLoadMore") {
              loadMoreRecentSidebar(SIDEBAR_PAGE_SIZE);
            }
          }
        }
        wasIntersecting = isIntersecting;
      },
      {
        root: sidebarScrollRef.current,
        rootMargin: "120px 0px",
      }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [
    hasMoreSidebarItems,
    loadMoreMySidebar,
    loadMoreRecentSidebar,
    mySidebarStatus,
    recentSidebarStatus,
    sidebarMode,
    sidebarReviews.length,
  ]);

  const keepMobileNavOpenOnNextRouteChange = React.useCallback(() => {
    preserveMobileNavOnRouteChangeRef.current = true;
  }, []);

  const drawerNavigation = (
    <>
      <DrawerLink active={pathname === "/dashboard"} href="/dashboard" icon="history" label="모든 리뷰" />
      {!authIsPending && viewer ? (
        <div
          className={`group flex min-h-11 items-center gap-2 pr-3 transition-colors duration-300 ${pathname.startsWith("/my-reviews") || pathname.startsWith("/write") ? "bg-surface-high" : ""
            } ${pathname.startsWith("/my-reviews") || pathname.startsWith("/write") ? "" : "hover:bg-surface-high"
            }`}
        >
          <Link
            className={`flex min-h-11 min-w-0 flex-1 items-center gap-2 px-3 py-0 leading-none transition-all duration-300 ${pathname.startsWith("/my-reviews") || pathname.startsWith("/write")
              ? "font-bold text-primary"
              : "text-muted-foreground group-hover:text-primary"
              }`}
            href="/my-reviews"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center">
              <AppIcon className="size-4" name="book" />
            </span>
            <span className="flex items-center whitespace-nowrap text-xs font-bold leading-none tracking-tight">내 리뷰</span>
          </Link>
          {showGlobalWriteButton ? (
            <Button asChild className="ml-auto shrink-0 rounded-none px-3 uppercase tracking-widest font-bold">
              <Link href={globalWriteHref}>{WRITE_BUTTON_LABEL}</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
      {!authIsPending && viewer?.role === "admin" ? (
        <DrawerLink
          active={pathname.startsWith("/admin/reviews")}
          href="/admin/reviews"
          icon="pending_actions"
          label={pendingCount ? `검토 대기 ${pendingCount}` : "검토 대기"}
        />
      ) : null}
      <div className="border-t border-border" />
      <nav className="min-h-9 px-3 py-2 text-[11px] text-muted-foreground">
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
                    <BreadcrumbPage className="block max-w-40 truncate text-[11px] font-medium text-foreground">
                      {crumb.label}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < sidebarTopCrumbs.length - 1 ? (
                  <BreadcrumbSeparator className="text-foreground/20 opacity-30">
                    <span className="mx-1">/</span>
                  </BreadcrumbSeparator>
                ) : null}
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </nav>

      {sidebarMode === "settings" ? null : (
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
                    title={entry.spoiler ? "<스포일러 리뷰>" : getReviewDisplayTitle(entry)}
                    author={entry.author?.name}
                    itemName={entry.nodeTitle ?? entry.proposedTitle}
                    spoiler={entry.spoiler}
                    score={entry.rating}
                  />
                );
              })}
            {hasMoreSidebarItems ? <div className="h-4" ref={loadMoreRef} /> : null}
          </div>
        </div>
      )}
    </>
  );

  const mobileDrawerNavigation = (
    <>
      <DrawerLink
        active={pathname === "/dashboard"}
        href="/dashboard"
        icon="history"
        label="모든 리뷰"
        onClick={keepMobileNavOpenOnNextRouteChange}
      />

      {!authIsPending && viewer ? (
        <div
          className={`flex min-h-11 items-center gap-2 pr-3 ${pathname.startsWith("/my-reviews") || pathname.startsWith("/write") ? "bg-surface-high" : ""
            }`}
        >
          <Link
            className={`flex min-h-11 min-w-0 flex-1 items-center gap-2 px-3 py-0 leading-none transition-all duration-300 ${pathname.startsWith("/my-reviews") || pathname.startsWith("/write")
              ? "font-bold text-primary"
              : "text-muted-foreground hover:text-primary"
              }`}
            href="/my-reviews"
            onClick={keepMobileNavOpenOnNextRouteChange}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center">
              <AppIcon className="size-4" name="book" />
            </span>
            <span className="flex items-center text-xs font-bold leading-none tracking-tight">내 리뷰</span>
          </Link>
          {showGlobalWriteButton ? (
            <Button asChild className="ml-auto shrink-0 rounded-none px-3 uppercase tracking-widest font-bold">
              <Link href={globalWriteHref}>{WRITE_BUTTON_LABEL}</Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      {!authIsPending && viewer?.role === "admin" ? (
        <DrawerLink
          active={pathname.startsWith("/admin/reviews")}
          href="/admin/reviews"
          icon="pending_actions"
          label={pendingCount ? `검토 대기 ${pendingCount}` : "검토 대기"}
        />
      ) : null}
      <div className="border-t border-border" />
      <nav className="min-h-9 px-3 py-2 text-[11px] text-muted-foreground">
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
                    <BreadcrumbPage className="block max-w-40 truncate text-[11px] font-medium text-foreground">
                      {crumb.label}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < sidebarTopCrumbs.length - 1 ? (
                  <BreadcrumbSeparator className="text-foreground/20 opacity-30">
                    <span className="mx-1">/</span>
                  </BreadcrumbSeparator>
                ) : null}
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </nav>

      {sidebarMode === "settings" ? null : (
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
                    title={entry.spoiler ? "<스포일러 리뷰>" : getReviewDisplayTitle(entry)}
                    author={entry.author?.name}
                    itemName={entry.nodeTitle ?? entry.proposedTitle}
                    spoiler={entry.spoiler}
                    score={entry.rating}
                  />
                );
              })}
            {hasMoreSidebarItems ? <div className="h-4" ref={loadMoreRef} /> : null}
          </div>
        </div>
      )}
    </>
  );

  const railNavigation = (
    <>
      <Link
        className="flex h-16 w-full items-center justify-center"
        href="/dashboard"
        onClick={keepMobileNavOpenOnNextRouteChange}
      >
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
            onClick={keepMobileNavOpenOnNextRouteChange}
          />
        ))}
      </nav>
      <div className="border-t border-border">
        {!authIsPending && viewer?.role === "admin" ? (
          <RailLink active={pathname.startsWith("/admin/categories/")} href="/admin/categories/new" icon="add" label="추가" />
        ) : null}
        <RailLink
          active={pathname.startsWith("/settings")}
          href="/settings"
          icon="user-cog"
          label={viewer ? "계정/설정" : "로그인/설정"}
        />
      </div>
    </>
  );

  return (
    <div className="relative flex h-dvh min-h-0 flex-col overflow-hidden bg-surface-mid text-foreground selection:bg-primary/20">
      <div className="flex min-h-0 w-full flex-1 overflow-hidden">
        <aside className="icon-rail-scrollbar hidden h-full w-16 shrink-0 flex-col items-stretch overflow-x-hidden overflow-y-auto border-r border-border bg-surface-lowest lg:flex">
          {railNavigation}
        </aside>

        <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-border bg-surface-low lg:flex">
          <div className="flex-1 overflow-y-auto custom-scrollbar" ref={sidebarScrollRef}>
            {drawerNavigation}
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-20 flex h-11 w-full items-center justify-between border-b border-border bg-surface-mid/80 px-4 backdrop-blur-xl lg:px-10">

            <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-3">
              <Sheet onOpenChange={setMobileNavOpen} open={mobileNavOpen}>
                <SheetTrigger asChild>
                  <Button
                    className="shrink-0 border-border text-foreground lg:hidden"
                    size="icon-sm"
                    variant="outline"
                  >
                    <MenuIcon className="h-4 w-4" />
                    <span className="sr-only">메뉴 열기</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  className="w-[min(100vw,24rem)] min-w-[16rem] border-r border-border bg-surface-mid p-0 text-foreground"
                  side="left"
                  showCloseButton={false}
                >
                  <SheetTitle className="sr-only">네비게이션</SheetTitle>
                  <div className="flex min-h-0 flex-1 overflow-hidden">
                    <aside className="icon-rail-scrollbar flex h-full w-14 shrink-0 flex-col items-stretch overflow-x-hidden overflow-y-auto border-r border-border bg-surface-lowest">
                      {railNavigation}
                    </aside>
                    <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto bg-surface-low">
                      {mobileDrawerNavigation}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <nav className="min-w-0 flex-1 overflow-hidden text-[11px] font-bold text-muted-foreground lg:hidden sm:text-xs">
                <Breadcrumb>
                  <BreadcrumbList className="flex-wrap gap-y-1 text-[11px] sm:text-xs">
                    {topCrumbs.map((crumb, index) => (
                      <div className="contents" key={`${crumb.label}-${index}`}>
                        <BreadcrumbItem>
                          {crumb.href ? (
                            <BreadcrumbLink asChild>
                              <Link href={crumb.href} className="block max-w-24 truncate transition-colors hover:text-primary sm:max-w-32">
                                {crumb.label}
                              </Link>
                            </BreadcrumbLink>
                          ) : (
                            <BreadcrumbPage className="block max-w-24 truncate font-black text-foreground sm:max-w-32">
                              {crumb.label}
                            </BreadcrumbPage>
                          )}
                        </BreadcrumbItem>
                        {index < topCrumbs.length - 1 ? (
                          <BreadcrumbSeparator className="text-foreground/10 opacity-30">
                            <span className="mx-1">/</span>
                          </BreadcrumbSeparator>
                        ) : null}
                      </div>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              </nav>

              <div className="hidden min-w-0 flex-1 lg:block">
                <DesktopNodeSearch items={items} pathname={pathname} searchParamsKey={searchParamsKey} />
              </div>
            </div>

          </header>
          <div className="custom-scrollbar px-4 py-6 lg:px-10 lg:py-10 w-full min-h-0 overflow-y-auto flex-1">{children}</div>
        </main>
      </div>
    </div>
  );
}

function DesktopNodeSearch({
  items,
  pathname,
  searchParamsKey,
}: {
  items: ContentNode[];
  pathname: string;
  searchParamsKey: string;
}) {
  const router = useRouter();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [search, setSearch] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const { hasNoResults, matches } = useContentNodePicker({
    items,
    limit: items.length,
    search,
  });

  const navigateToItem = React.useCallback(
    (item: ContentNode) => {
      setSearch("");
      setIsOpen(false);
      setActiveIndex(-1);
      router.push(`/n/${encodeURIComponent(item.slug)}`);
    },
    [router]
  );

  React.useEffect(() => {
    setSearch("");
    setIsOpen(false);
    setActiveIndex(-1);
  }, [pathname, searchParamsKey]);

  React.useEffect(() => {
    setActiveIndex(matches.length ? 0 : -1);
  }, [matches]);

  React.useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!matches.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => {
        if (current < 0) {
          return 0;
        }
        return Math.min(current + 1, matches.length - 1);
      });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => {
        if (current < 0) {
          return matches.length - 1;
        }
        return Math.max(current - 1, 0);
      });
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      navigateToItem(matches[activeIndex] ?? matches[0]);
    }
  };

  return (
    <div className="relative max-w-xl" ref={containerRef}>
      <label className="sr-only" htmlFor="desktop-node-search">
        항목 검색
      </label>
      <div className="flex h-8 items-center gap-3 border border-border bg-surface-low px-4 text-sm text-muted-foreground transition-colors focus-within:border-primary/40">
        <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground/60" />
        <input
          aria-autocomplete="list"
          aria-controls="desktop-node-search-results"
          aria-expanded={isOpen && (!!matches.length || hasNoResults)}
          className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/60"
          id="desktop-node-search"
          onChange={(event) => {
            setSearch(event.currentTarget.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (search.trim()) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="항목 검색"
          role="combobox"
          value={search}
        />
      </div>
      {isOpen && search.trim() ? (
        <div
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden border border-border bg-surface-low shadow-2xl"
          id="desktop-node-search-results"
          role="listbox"
        >
          {matches.length ? (
            <div className="custom-scrollbar grid max-h-[min(24rem,calc(100dvh-10rem))] gap-px overflow-y-auto bg-border">
              {matches.map((item, index) => (
                <button
                  aria-selected={index === activeIndex}
                  className={`flex items-center justify-between gap-3 bg-surface-lowest px-4 py-3 text-left transition-colors ${index === activeIndex ? "bg-surface-high" : "hover:bg-surface-high"
                    }`}
                  key={item.id}
                  onClick={() => navigateToItem(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  role="option"
                  type="button"
                >
                  <span className="min-w-0 truncate text-sm font-semibold tracking-tight text-foreground">{item.title}</span>
                  <span className="shrink-0 text-[11px] font-black uppercase tracking-[0.2em] text-primary">{item.categorySlug}</span>
                </button>
              ))}
            </div>
          ) : hasNoResults ? (
            <div className="px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              일치하는 항목이 없습니다.
            </div>
          ) : null}
        </div>
      ) : null}
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
  if (pathname.startsWith("/my-reviews") || pathname.startsWith("/write")) {
    return "mine";
  }

  if (pathname.startsWith("/settings")) {
    return "settings";
  }

  if (pathname.startsWith("/c/")) {
    return "category";
  }

  if (pathname.startsWith("/admin/reviews")) {
    return "pending";
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
    return [{ label: "모든 리뷰" }];
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
  onClick,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Link
      className={`flex aspect-square w-full flex-col items-center justify-center gap-0.5 rounded-none transition-all duration-300 ${active ? "border-l-4 border-primary bg-surface-high text-primary" : "text-muted-foreground/60 hover:bg-surface-high hover:text-primary"}`}
      href={href}
      onClick={onClick}
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
  onClick,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Link
      className={`flex min-h-11 w-full items-center gap-2 rounded-none px-3 py-0 leading-none transition-all duration-300 ${active ? "bg-surface-high font-bold text-primary" : "text-muted-foreground hover:bg-surface-high hover:text-primary"}`}
      href={href}
      onClick={onClick}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        <AppIcon className="size-4" name={icon} />
      </span>
      <span className="flex items-center whitespace-nowrap text-xs font-bold leading-none tracking-tight">{label}</span>
    </Link>
  );
}

function CollectionLink({
  href,
  title,
  category,
  author,
  itemName,
  score,
  spoiler = false,
  active = false,
}: {
  href: string;
  title: string;
  category?: string;
  author?: string;
  itemName?: string;
  score?: number;
  spoiler?: boolean;
  active?: boolean;
}) {
  return (
    <Link
      className={`group block cursor-pointer rounded-none px-3 py-2 transition-colors duration-200 ${active ? "bg-surface-high" : "hover:bg-surface-high"
        }`}
      href={href}
    >
      <span
        className={`block truncate text-sm tracking-tight transition-colors duration-200 ${spoiler
          ? active
            ? "text-[var(--spoiler)]"
            : "text-[color:color-mix(in_srgb,var(--spoiler)_82%,transparent)] group-hover:text-[var(--spoiler)] group-hover:opacity-100"
          : active
            ? "text-primary"
            : "text-foreground/70 group-hover:text-primary group-hover:opacity-100"
          }`}
      >
        {title}
      </span>
      {category ? (
        <span
          className={`mt-1 block text-[10px] font-bold uppercase tracking-widest transition-colors duration-200 ${active ? "text-primary/80" : "text-muted-foreground group-hover:text-foreground/100"
            }`}
        >
          {category}
        </span>
      ) : null}
      {(author || typeof score === "number" || itemName) ? (
        <span
          className={`mt-0.5 block text-[10px] leading-tight transition-colors duration-200 ${active ? "text-foreground/60" : "text-muted-foreground/80"
            }`}
        >
          {author ? <span>{author}</span> : null}
          {author && typeof score === "number" ? <span className="text-muted-foreground/70"> · </span> : null}
          {typeof score === "number" ? <span>{formatCompactRating(score)}</span> : null}
          {(author || typeof score === "number") && itemName ? <span className="text-muted-foreground/70"> · </span> : null}
          {itemName ? <span>{itemName}</span> : null}
        </span>
      ) : null}
    </Link>
  );
}
