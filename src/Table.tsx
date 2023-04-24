import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useEffect, useRef, useState } from 'react';
import { faker } from '@faker-js/faker';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useOverlayScrollbars } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';

type Person = {
  firstName: string;
  lastName: string;
  age: number;
  visits: number;
  status: string;
  progress: number;
};

const generatePerson = (): Person => ({
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  age: Number(faker.random.numeric(2)),
  visits: Number(faker.random.numeric(3)),
  status: faker.random.word(),
  progress: Number(faker.random.numeric(2))
});

const data = Array.from({ length: 10000 }, () => generatePerson());

const columnHelper = createColumnHelper<Person>();

const columns = [
  columnHelper.accessor('firstName', {
    cell: (info) => info.getValue(),
    footer: (info) => info.column.id
  }),
  columnHelper.accessor((row) => row.lastName, {
    id: 'lastName',
    cell: (info) => <i>{info.getValue()}</i>,
    header: () => <span>Last Name</span>,
    footer: (info) => info.column.id
  }),
  columnHelper.accessor('age', {
    header: () => 'Age',
    cell: (info) => info.renderValue(),
    footer: (info) => info.column.id
  }),
  columnHelper.accessor('visits', {
    header: () => <span>Visits</span>,
    footer: (info) => info.column.id
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    footer: (info) => info.column.id
  }),
  columnHelper.accessor('progress', {
    header: 'Profile Progress',
    footer: (info) => info.column.id
  })
];

export default function VirtualTable() {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  /**
   * Note: Tanstack Table with Tanstack Virtualizer Example
   * [virtualized-rows](https://tanstack.com/table/v8/docs/examples/react/virtualized-rows)
   * [Virtualizer](https://tanstack.com/virtual/v3/docs/guide/introduction)
   */
  const scrollRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 5
  });

  const { getVirtualItems, getTotalSize } = rowVirtualizer;
  const paddingTop = getVirtualItems().length > 0 ? getVirtualItems()?.at(0)?.start ?? 0 : 0;
  const paddingBottom = getVirtualItems().length > 0 ? getTotalSize() - (getVirtualItems()?.at(-1)?.end ?? 0) : 0;

  /**
   * NOTE: OverlayScrollbars with virtual scroll libraries example
   * [fixed](https://stackblitz.com/edit/react-jnzpm8?file=index.js)
   * [horizontal](https://stackblitz.com/edit/react-wdbggw?file=index.js)
   */
  const [scrollState, setScrollState] = useState({
    scrollX: 0,
    scrollY: 0,
    lastScrollXTime: 0,
    lastScrollYTime: 0
  });

  const [initialize, osInstance] = useOverlayScrollbars({
    defer: false,
    options: { scrollbars: { autoHide: 'move' } },
    events: {
      scroll: (e) => {
        const scrollX = (e.elements().scrollEventElement as HTMLElement).scrollLeft;
        const scrollY = (e.elements().scrollEventElement as HTMLElement).scrollTop;

        if ((scrollX > 0 && scrollX === 0) || (scrollX === 0 && scrollX > 0)) {
          return setScrollState((prev) => ({ ...prev, scrollX, lastScrollXTime: Date.now() }));
        }

        if ((scrollY > 0 && scrollY === 0) || (scrollY === 0 && scrollY > 0)) {
          return setScrollState((prev) => ({ ...prev, scrollY, lastScrollYTime: Date.now() }));
        }
      }
    }
  });

  useEffect(() => {
    if (scrollRef.current && parentRef.current) {
      initialize({ target: scrollRef.current, elements: { viewport: parentRef.current } });
    }

    return () => osInstance()?.destroy();
  }, [initialize, osInstance]);

  return (
    <div ref={scrollRef} className='max-h-96 max-w-xl overflow-auto ring-1 m-4 relative'>
      <div ref={parentRef} className='overflow-hidden'>
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} />
              </tr>
            )}

            {getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];

              return (
                <tr key={row.id} style={{ height: 35 }}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              );
            })}

            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
