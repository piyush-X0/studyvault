export const markdownComponents = {
    h1: ({ children }: any) => (
        <h1 className="mt-6 mb-2 text-2xl font-semibold text-neutral-100 first:mt-0">
            {children}
        </h1>
    ),
    h2: ({ children }: any) => (
        <h2 className="mt-6 mb-2 text-xl font-semibold text-neutral-100 first:mt-0">
            {children}
        </h2>
    ),
    h3: ({ children }: any) => (
        <h3 className="mt-4 mb-2 text-base font-semibold text-neutral-100 first:mt-0">
            {children}
        </h3>
    ),
    p: ({ children }: any) => (
        <p className="mb-3 text-[15px] leading-6 text-neutral-200 last:mb-0">
            {children}
        </p>
    ),
    strong: ({ children }: any) => (
        <strong className="font-semibold text-neutral-50">{children}</strong>
    ),
    em: ({ children }: any) => (
        <em className="italic text-neutral-200">{children}</em>
    ),
    a: ({ children, href }: any) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline underline-offset-2 hover:text-blue-300"
        >
            {children}
        </a>
    ),
    ul: ({ children }: any) => (
        <ul className="mb-3 ml-4 list-disc space-y-1 text-neutral-200 last:mb-0">
            {children}
        </ul>
    ),
    ol: ({ children }: any) => (
        <ol className="mb-3 ml-4 list-decimal space-y-1 text-neutral-200 last:mb-0">
            {children}
        </ol>
    ),
    li: ({ children }: any) => <li className="pl-1 leading-6">{children}</li>,
    blockquote: ({ children }: any) => (
        <blockquote className="mb-3 border-l-2 border-neutral-700 pl-3 text-neutral-400 italic last:mb-0">
            {children}
        </blockquote>
    ),
    hr: () => <hr className="my-4 border-neutral-800" />,
    code: ({ inline, className, children }: any) =>
        inline ? (
            <code className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-[13px] text-neutral-100">
                {children}
            </code>
        ) : (
            <code className={`font-mono text-[13px] text-neutral-100 ${className ?? ""}`}>
                {children}
            </code>
        ),
    pre: ({ children }: any) => (
        <pre className="mb-3 overflow-x-auto rounded-lg bg-neutral-900 p-3 last:mb-0">
            {children}
        </pre>
    ),
    table: ({ children }: any) => (
        <div className="mb-3 overflow-x-auto last:mb-0">
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