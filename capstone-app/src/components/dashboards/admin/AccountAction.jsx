import { Trash, RotateCcw, SquarePen, UserKey } from "lucide-react";
import { Link } from "react-router-dom";

const blue = "bg-blue-50 text-blue-700 hover:bg-blue-100";
const actions = {
  edit: { label: "Edit", Icon: SquarePen, color: blue },
  deactivate: {
    label: "Deactivate",
    Icon: Trash,
    color: "bg-red-50 text-red-700 hover:bg-red-100",
  },
  reactivate: {
    label: "Reactivate",
    Icon: RotateCcw,
    color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  },
  recovery: { label: "Account recovery", Icon: UserKey, color: blue },
};

export default function AccountAction({ action, onClick, to, ariaLabel }) {
  const { label, Icon, color } = actions[action];
  const props = {
    title: label,
    "aria-label": ariaLabel || label,
    className: `inline-grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${color}`,
    children: <Icon size={18} aria-hidden="true" />,
  };

  return to ? (
    <Link to={to} {...props} />
  ) : (
    <button type="button" onClick={onClick} {...props} />
  );
}
