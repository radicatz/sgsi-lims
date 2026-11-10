// Icons: Phosphor Regular, the same set as the FigCraft library. Named by their kebab-case glyph names, as in the design.
import { ArrowRight } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { Barcode } from "@phosphor-icons/react/dist/csr/Barcode";
import { Bell } from "@phosphor-icons/react/dist/csr/Bell";
import { Buildings } from "@phosphor-icons/react/dist/csr/Buildings";
import { CaretDoubleLeft } from "@phosphor-icons/react/dist/csr/CaretDoubleLeft";
import { CaretDoubleRight } from "@phosphor-icons/react/dist/csr/CaretDoubleRight";
import { CaretDown } from "@phosphor-icons/react/dist/csr/CaretDown";
import { CaretRight } from "@phosphor-icons/react/dist/csr/CaretRight";
import { CheckCircle } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { CheckSquareOffset } from "@phosphor-icons/react/dist/csr/CheckSquareOffset";
import { ClipboardText } from "@phosphor-icons/react/dist/csr/ClipboardText";
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/csr/ClockCounterClockwise";
import { Cylinder } from "@phosphor-icons/react/dist/csr/Cylinder";
import { Eye } from "@phosphor-icons/react/dist/csr/Eye";
import { EyeSlash } from "@phosphor-icons/react/dist/csr/EyeSlash";
import { FileText } from "@phosphor-icons/react/dist/csr/FileText";
import { GearSix } from "@phosphor-icons/react/dist/csr/GearSix";
import { Info } from "@phosphor-icons/react/dist/csr/Info";
import { List } from "@phosphor-icons/react/dist/csr/List";
import { LockSimple } from "@phosphor-icons/react/dist/csr/LockSimple";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { Package } from "@phosphor-icons/react/dist/csr/Package";
import { Question } from "@phosphor-icons/react/dist/csr/Question";
import { Rows } from "@phosphor-icons/react/dist/csr/Rows";
import { SignOut } from "@phosphor-icons/react/dist/csr/SignOut";
import { SquaresFour } from "@phosphor-icons/react/dist/csr/SquaresFour";
import { Stack } from "@phosphor-icons/react/dist/csr/Stack";
import { User } from "@phosphor-icons/react/dist/csr/User";
import { Users } from "@phosphor-icons/react/dist/csr/Users";
import { Warning } from "@phosphor-icons/react/dist/csr/Warning";
import { WarningCircle } from "@phosphor-icons/react/dist/csr/WarningCircle";
import { X } from "@phosphor-icons/react/dist/csr/X";
import type { Icon as PhIcon } from "@phosphor-icons/react";

const ICONS: Record<string, PhIcon> = {
  "arrow-right": ArrowRight, barcode: Barcode, bell: Bell, buildings: Buildings, "caret-double-left": CaretDoubleLeft,
  "caret-double-right": CaretDoubleRight, "caret-down": CaretDown, "caret-right": CaretRight, "check-circle": CheckCircle,
  "check-square-offset": CheckSquareOffset, "clipboard-text": ClipboardText, "clock-counter-clockwise": ClockCounterClockwise,
  cylinder: Cylinder, eye: Eye, "eye-slash": EyeSlash, "file-text": FileText, "gear-six": GearSix, info: Info, list: List,
  "lock-simple": LockSimple, "magnifying-glass": MagnifyingGlass, package: Package, question: Question, rows: Rows,
  "sign-out": SignOut, "squares-four": SquaresFour, stack: Stack, user: User, users: Users, warning: Warning,
  "warning-circle": WarningCircle, x: X,
};

export function Icon({ n, s = 14, className }: { n: string; s?: 14 | 16 | 20 | 24 | 32; className?: string }) {
  const C = ICONS[n] ?? Question;
  return <span className={["ph", s !== 14 ? `i${s}` : "", className].filter(Boolean).join(" ")} aria-hidden="true"><C size={s} /></span>;
}
