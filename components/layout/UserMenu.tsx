'use client';

import { ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROLE_LABELS, type Role } from '@/lib/constants';
import { LogoutDialog } from './LogoutDialog';

type Props = {
  user: {
    fullName: string;
    role: Role;
    organizationName: string | null;
  };
};

export function UserMenu({ user }: Props) {
  const initials = getInitials(user.fullName);
  const roleLine =
    user.organizationName != null
      ? `${ROLE_LABELS[user.role]} · ${user.organizationName}`
      : ROLE_LABELS[user.role];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-md p-1 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-blue-700 text-white text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden md:flex flex-col items-start leading-tight">
          <span className="text-sm font-semibold text-slate-900">
            {user.fullName}
          </span>
          <span className="text-sm text-slate-600 truncate max-w-[180px]">
            {roleLine}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-semibold">
              Xin chào, {user.fullName}
            </span>
            <span className="text-xs text-slate-600 truncate">{roleLine}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <LogoutDialog />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first) return '?';
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const last = parts[parts.length - 1] ?? first;
  const firstChar = first.charAt(0);
  const lastChar = last.charAt(0);
  return (firstChar + lastChar).toUpperCase();
}
