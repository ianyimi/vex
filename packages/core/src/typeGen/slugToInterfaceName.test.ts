import { describe, it, expect } from "vitest";
import { slugToInterfaceName } from "./slugToInterfaceName";

describe("slugToInterfaceName", () => {
  it("converts hyphen-separated slug", () => {
    expect(slugToInterfaceName({ slug: "blog-posts" })).toBe("BlogPosts");
  });

  it("converts underscore-separated slug", () => {
    expect(slugToInterfaceName({ slug: "new_block" })).toBe("NewBlock");
  });

  it("converts single word", () => {
    expect(slugToInterfaceName({ slug: "media" })).toBe("Media");
  });

  it("converts mixed separators", () => {
    expect(slugToInterfaceName({ slug: "user-blog_posts" })).toBe("UserBlogPosts");
  });

  it("handles already PascalCase", () => {
    expect(slugToInterfaceName({ slug: "BlogPosts" })).toBe("BlogPosts");
  });

  it("normalizes all uppercase", () => {
    expect(slugToInterfaceName({ slug: "FAQ" })).toBe("Faq");
  });

  it("handles single character segments", () => {
    expect(slugToInterfaceName({ slug: "a-b-c" })).toBe("ABC");
  });

  it("converts camelCase to PascalCase", () => {
    expect(slugToInterfaceName({ slug: "userProfile" })).toBe("UserProfile");
  });
});
