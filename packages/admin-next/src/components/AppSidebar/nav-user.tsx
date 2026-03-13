"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@vexcms/ui";
import {
  ChevronsUpDownIcon,
  SparklesIcon,
  BadgeCheckIcon,
  CreditCardIcon,
  BellIcon,
  LogOutIcon,
  UserIcon,
  CheckIcon,
} from "lucide-react";
import { usePermissionContext } from "../../context/PermissionContext";
import type { PermissionUser } from "../../context/PermissionContext";

export interface NavUserData {
  name: string;
  email: string;
  avatar?: string;
}

export function NavUser({
  user,
  onImpersonate,
  impersonatableUsers,
}: {
  user: NavUserData;
  onImpersonate?: (target: PermissionUser) => void;
  impersonatableUsers?: PermissionUser[];
}) {
  const { isMobile } = useSidebar();

  // Try to get permission context for impersonation state
  let canImpersonate = false;
  let currentImpersonatedId: string | undefined;
  try {
    const ctx = usePermissionContext();
    canImpersonate = ctx.canImpersonate;
    currentImpersonatedId = ctx.impersonation.active
      ? ctx.impersonation.impersonatedUser?.id
      : undefined;
  } catch {
    // No permission provider
  }

  const showImpersonation = canImpersonate && onImpersonate && impersonatableUsers && impersonatableUsers.length > 0;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            {user.avatar && (
              <Avatar>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            )}
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg max-h-[400px] overflow-y-auto"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  {user.avatar && (
                    <Avatar>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <SparklesIcon />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheckIcon />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCardIcon />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            {showImpersonation && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Impersonate User</DropdownMenuLabel>
                  {impersonatableUsers.map((target) => (
                    <DropdownMenuItem
                      key={target.id}
                      onClick={() => onImpersonate(target)}
                    >
                      <UserIcon className="h-3 w-3" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="truncate text-sm">{target.name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {target.roles.join(", ")}
                        </span>
                      </div>
                      {currentImpersonatedId === target.id && (
                        <CheckIcon className="h-3 w-3 ml-auto text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
