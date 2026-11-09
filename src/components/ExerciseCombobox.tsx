import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string };

/** Remove acentos e baixa caixa para busca tolerante ("perna" acha "Pérna"). */
function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function ExerciseCombobox({
  options,
  value,
  onChange,
  placeholder = "Selecionar…",
  className,
}: {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => options.find((o) => o.id === value), [options, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "mt-1 flex w-full items-center justify-between gap-2 rounded-md border border-border bg-card px-2 py-2 text-left text-sm font-mono",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{selected ? selected.name : placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-[240px] p-0 border-border bg-card"
      >
        <Command
          filter={(itemValue, search) => (normalize(itemValue).includes(normalize(search)) ? 1 : 0)}
        >
          <CommandInput placeholder="Digite para buscar…" className="font-mono text-sm" />
          <CommandList>
            <CommandEmpty className="py-4 text-center text-xs font-mono text-muted-foreground">
              Nenhum exercício encontrado.
            </CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={o.name}
                  onSelect={() => {
                    onChange(o.id === value ? "" : o.id);
                    setOpen(false);
                  }}
                  className="font-mono text-sm"
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value === o.id ? "opacity-100" : "opacity-0")}
                  />
                  <span className="truncate">{o.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
