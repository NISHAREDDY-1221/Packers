// @ts-nocheck
import type { ReactNode } from 'react';
import SortableTableHeader from './SortableTableHeader';

export interface Column<T> {
  key: string;
  label: ReactNode; // ✅ UPDATED
  sortable?: boolean;
  render?: (item: T) => ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  sortField?: string | null;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: (field: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  keyExtractor: (item: T) => string | number;
}

function DataTable<T>({
  data,
  columns,
  sortField,
  sortDirection,
  onSort,
  loading = false,
  emptyMessage = 'No data available',
  keyExtractor,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto table-scrollbar">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b">
            {columns.map((column) => (
              <SortableTableHeader
                key={column.key}
                field={column.key}
                label={column.label}
                currentField={sortField ?? null}
                direction={sortDirection ?? null}
                onSort={
                  column.sortable
                    ? (field) => onSort?.(field)
                    : undefined
                }
              />
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-sm text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="border-b hover:bg-gray-50 transition"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-2 py-3 text-xs"
                  >
                    {column.render
                      ? column.render(item)
                      : (item as any)[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;