module.exports = {
  QUALITY_ROUTES: [
    { path: "/" },
    { path: "/features" },
    { path: "/roadmap" },
    { path: "/privacy" },
    { path: "/brand" },
    { path: "/accessibility" },
    { path: "/posts/plate-upgrade-smoke" },
    { path: "/tour" },
    { path: "/auth/sign-in" },
    { path: "/auth/sign-up" },
    { notFound: true, path: "/a-page-that-does-not-exist" },
    { path: "/unauthorized" },
  ],
};
