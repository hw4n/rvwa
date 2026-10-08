/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { getErrorMessage } from "../lib/error-message";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

async function setup(role: "admin" | "member" = "admin") {
  const t = convexTest(schema, modules);
  const userId = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", { role });
    await ctx.db.insert("categories", {
      slug: "software",
      name: "Software",
      description: "",
      icon: "",
      createdAt: "2026-10-08T00:00:00Z",
      updatedAt: "2026-10-08T00:00:00Z",
    });
    return userId;
  });
  return { t, viewer: t.withIdentity({ subject: `${userId}|test-session` }) };
}

const input = {
  categorySlug: "software",
  title: "Image without summary",
  slug: "image-without-summary",
  summary: "",
  coverImage: "https://cdn.hwan.me/nodes/test.png",
  tags: [],
  attributes: {},
};

test("an admin can create and update an item with a poster and no summary", async () => {
  const { t, viewer } = await setup();
  const { nodeId } = await viewer.mutation(api.nodes.create, input);
  await viewer.mutation(api.nodes.update, {
    ...input,
    currentSlug: input.slug,
    summary: "   ",
  });
  const node = await t.run((ctx) => ctx.db.get(nodeId));
  expect(node?.summary).toBe("");
  expect(node?.coverImage).toBe(input.coverImage);
});

test("invalid input exposes the reason and does not insert an item", async () => {
  const { t, viewer } = await setup();
  for (const patch of [{ title: "   " }, { summary: "a".repeat(2001) }]) {
    await expect(viewer.mutation(api.nodes.create, { ...input, ...patch }))
      .rejects.toBeInstanceOf(ConvexError);
  }
  expect(await t.run((ctx) => ctx.db.query("nodes").take(1))).toEqual([]);
});

test("allowing an empty summary retains admin authorization", async () => {
  const { t, viewer } = await setup("member");
  await expect(viewer.mutation(api.nodes.create, input)).rejects.toThrow("관리자만");
  await expect(t.mutation(api.nodes.create, input)).rejects.toThrow("다시 로그인");
  expect(await t.run((ctx) => ctx.db.query("nodes").take(1))).toEqual([]);
});

test("the form displays a Convex validation message without the server error wrapper", () => {
  expect(getErrorMessage(new ConvexError("다른 slug를 입력해주세요."), "실패"))
    .toBe("다른 slug를 입력해주세요.");
  expect(getErrorMessage(new Error("Network error"), "실패")).toBe("Network error");
  expect(getErrorMessage(null, "실패")).toBe("실패");
});
