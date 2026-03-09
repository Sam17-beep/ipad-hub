import { motion } from "framer-motion";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: string;
}

export default function Checkbox({ checked, onChange, color = "bg-accent-blue" }: CheckboxProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
        checked ? `${color} border-transparent` : "border-border hover:border-text-muted"
      }`}
    >
      {checked && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className="text-white text-xs"
        >
          ✓
        </motion.span>
      )}
    </button>
  );
}
