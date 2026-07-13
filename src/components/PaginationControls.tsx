import { VEHICLE_TABLE_PAGE_SIZE } from '../lib/inventoryLogic'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
}

function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: PaginationControlsProps) {
  const rangeStart =
    totalItems === 0 ? 0 : (currentPage - 1) * VEHICLE_TABLE_PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * VEHICLE_TABLE_PAGE_SIZE, totalItems)

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-on-surface-variant">
      <p>
        Showing {rangeStart}-{rangeEnd} of {totalItems} vehicles
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={totalPages <= 1 || currentPage <= 1}
          className="rounded border border-primary-container px-3 py-1 text-sm font-semibold text-primary-container hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={totalPages <= 1 || currentPage >= totalPages}
          className="rounded border border-primary-container px-3 py-1 text-sm font-semibold text-primary-container hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default PaginationControls
