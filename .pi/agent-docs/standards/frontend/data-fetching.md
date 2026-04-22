## Data Fetching Standards (TanStack Query + Convex)

### Overview

This project uses **TanStack Query** for server state management with **Convex** as the backend:
- Automatic caching and background synchronization
- Optimistic updates for mutations
- Real-time subscriptions via Convex

### Setup

```tsx
// app/providers.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ConvexProvider>
  );
}
```

### Convex with React Hooks (Preferred)

For most cases, use Convex's built-in React hooks which provide real-time subscriptions:

```tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function UserList() {
  // Real-time subscription - updates automatically
  const users = useQuery(api.users.list);

  // Mutation
  const createUser = useMutation(api.users.create);

  if (users === undefined) {
    return <Skeleton />;
  }

  return (
    <ul>
      {users.map((user) => (
        <li key={user._id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### TanStack Query with Convex

Use TanStack Query when you need additional control over caching, prefetching, or non-realtime data:

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";

function UserProfile({ userId }: { userId: Id<"users"> }) {
  const convex = useConvex();
  const queryClient = useQueryClient();

  // Query with TanStack Query
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => convex.query(api.users.get, { id: userId }),
  });

  // Mutation with cache invalidation
  const updateUser = useMutation({
    mutationFn: (data: { name: string }) =>
      convex.mutation(api.users.update, { id: userId, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
  });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <h1>{user.name}</h1>
      <Button onClick={() => updateUser.mutate({ name: "New Name" })}>
        Update
      </Button>
    </div>
  );
}
```

### Query Keys

Structure query keys consistently for effective cache management:

```tsx
// Query key factory pattern
const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: Id<"users">) => [...userKeys.details(), id] as const,
};

// Usage
useQuery({
  queryKey: userKeys.detail(userId),
  queryFn: () => convex.query(api.users.get, { id: userId }),
});

// Invalidate all user queries
queryClient.invalidateQueries({ queryKey: userKeys.all });

// Invalidate specific user
queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
```

### Query Options

```tsx
useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,

  // Cache timing
  staleTime: 1000 * 60 * 5, // Data fresh for 5 minutes
  gcTime: 1000 * 60 * 30,   // Keep in cache for 30 minutes

  // Conditional fetching
  enabled: !!userId, // Only fetch when userId exists

  // Transform response
  select: (data) => data.filter((user) => user.active),

  // Placeholder while loading
  placeholderData: [],

  // Refetch behavior
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  retry: 3,
});
```

### Mutations

**Basic mutation**:
```tsx
const createUser = useMutation({
  mutationFn: (newUser: NewUser) =>
    convex.mutation(api.users.create, newUser),
  onSuccess: (data, variables) => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ["users"] });
  },
  onError: (error) => {
    toast.error("Failed to create user");
  },
});

// Usage
createUser.mutate({ name: "John", email: "john@example.com" });
```

**Optimistic updates**:
```tsx
const updateUser = useMutation({
  mutationFn: (data: UpdateUserData) =>
    convex.mutation(api.users.update, data),
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["user", newData.id] });

    // Snapshot previous value
    const previousUser = queryClient.getQueryData(["user", newData.id]);

    // Optimistically update
    queryClient.setQueryData(["user", newData.id], (old) => ({
      ...old,
      ...newData,
    }));

    // Return context with snapshot
    return { previousUser };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(
      ["user", newData.id],
      context?.previousUser
    );
  },
  onSettled: (data, error, variables) => {
    // Always refetch after error or success
    queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
  },
});
```

### Dependent Queries

```tsx
// Fetch user first, then their posts
const { data: user } = useQuery({
  queryKey: ["user", userId],
  queryFn: () => convex.query(api.users.get, { id: userId }),
});

const { data: posts } = useQuery({
  queryKey: ["posts", user?.id],
  queryFn: () => convex.query(api.posts.listByUser, { userId: user!._id }),
  enabled: !!user, // Only run when user is loaded
});
```

### Parallel Queries

```tsx
import { useQueries } from "@tanstack/react-query";

function Dashboard() {
  const results = useQueries({
    queries: [
      {
        queryKey: ["users"],
        queryFn: () => convex.query(api.users.list),
      },
      {
        queryKey: ["posts"],
        queryFn: () => convex.query(api.posts.list),
      },
      {
        queryKey: ["stats"],
        queryFn: () => convex.query(api.stats.get),
      },
    ],
  });

  const isLoading = results.some((r) => r.isLoading);
  const [users, posts, stats] = results.map((r) => r.data);
}
```

### Pagination

```tsx
import { useInfiniteQuery } from "@tanstack/react-query";

function InfiniteUserList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["users", "infinite"],
    queryFn: ({ pageParam }) =>
      convex.query(api.users.listPaginated, { cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  return (
    <div>
      {data?.pages.flatMap((page) =>
        page.items.map((user) => <UserCard key={user._id} user={user} />)
      )}
      {hasNextPage && (
        <Button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "Loading..." : "Load More"}
        </Button>
      )}
    </div>
  );
}
```

### Loading and Error States

```tsx
function UserData({ userId }: { userId: Id<"users"> }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => convex.query(api.users.get, { id: userId }),
  });

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message}
          <Button variant="link" onClick={() => refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return <UserProfile user={data} />;
}
```

### Best Practices

- **Prefer Convex hooks** for real-time data that should update automatically
- **Use TanStack Query** when you need fine-grained cache control or prefetching
- **Structure query keys** consistently using factory pattern
- **Invalidate after mutations** to keep cache in sync
- **Use optimistic updates** for better perceived performance
- **Handle loading and error states** in every component
- **Set appropriate staleTime** - don't refetch data that doesn't change often
- **Use enabled option** for dependent queries

### Related Standards

- See [forms.md](./forms.md) for form submission with mutations
- See [tables.md](./tables.md) for displaying query results in tables
