interface HeaderProps {
  title?: string;
}

export function Header({ title = "Vex Admin" }: HeaderProps) {
  return (
    <header className="flex h-14 items-center border-b border-border px-6">
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  );
}
