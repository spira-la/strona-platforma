import { Loader2 } from 'lucide-react';

export interface AdminTableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
}

interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  emptyIcon?: React.ElementType;
  emptyMessage?: string;
  ariaLabel?: string;
}

export function AdminTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  isError = false,
  errorMessage,
  emptyIcon: EmptyIcon,
  emptyMessage,
  ariaLabel,
}: AdminTableProps<T>) {
  return (
    <div className="bg-white border border-line rounded-xl overflow-hidden">
      {isError ? (
        <div className="flex items-center justify-center py-12 px-6">
          <p className="font-['Inter'] text-[14px] text-red-500 text-center">
            {errorMessage ?? 'An error occurred while loading data.'}
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2
            className="w-6 h-6 animate-spin text-brand"
            aria-label="Loading"
          />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          {EmptyIcon && (
            <EmptyIcon
              style={{ width: 36, height: 36 }}
              className="text-[#DDDDDD]"
              strokeWidth={1.5}
            />
          )}
          {emptyMessage && (
            <p className="font-['Inter'] text-[14px] text-ink-muted">
              {emptyMessage}
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]" aria-label={ariaLabel}>
            <thead>
              <tr className="bg-surface">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={[
                      "px-4 py-3 text-left font-['Inter'] text-[11px] uppercase tracking-wider text-ink-muted font-semibold",
                      col.className ?? '',
                    ].join(' ')}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className="hover:bg-[#FDFCFA] transition-colors border-b border-line-soft last:border-b-0"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={['px-4 py-3.5', col.className ?? ''].join(' ')}
                    >
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminTable;
