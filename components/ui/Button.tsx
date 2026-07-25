type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  onClick?: () => void;
  disabled?: boolean;
};

export default function Button({
  children,
  variant = "primary",
  onClick,
  disabled = false,
}: ButtonProps) {
  const baseStyle =
    "w-full rounded-xl py-4 text-lg font-bold transition-all duration-300";

  const variants = {
    primary:
      "bg-yellow-500 text-black hover:bg-yellow-400 active:scale-95",

    secondary:
      "border border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black active:scale-95",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}