export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-md border border-zinc-400 px-2 py-1 text-gray-800 disabled:text-gray-400"
      {...props}
    />
  )
}
