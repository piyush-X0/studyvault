export const markdownComponents = {
    h2: ({ children }: any) => (
        <h2 className="mt-4 mb-2 text-lg font-semibold text-neutral-100 first:mt-0">
            {children}
        </h2>
    ),
    p: ({ children }: any) => (
        <p className="mb-3 leading-6 text-neutral-200 last:mb-0">{children}</p>
    ),
    strong: ({ children }: any) => (
        <strong className="font-semibold text-neutral-50">{children}</strong>
    ),
    ul: ({ children }: any) => (
        <ul className="mb-3 ml-4 list-disc space-y-1 text-neutral-200">
            {children}
        </ul>
    ),
    ol: ({ children }: any) => (
        <ol className="mb-3 ml-4 list-decimal space-y-1 text-neutral-200">
            {children}
        </ol>
    ),
    li: ({ children }: any) => <li className="pl-1">{children}</li>,
    hr: () => <hr className="my-4 border-neutral-800" />,
    table: ({ children }: any) => (
        <div className="mb-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">{children}</table>
        </div>
    ),
    th: ({ children }: any) => (
        <th className="border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-left font-medium text-neutral-200">
            {children}
        </th>
    ),
    td: ({ children }: any) => (
        <td className="border border-neutral-800 px-3 py-1.5 text-neutral-300">
            {children}
        </td>
    ),
};