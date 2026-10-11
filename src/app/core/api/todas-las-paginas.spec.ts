import { of } from 'rxjs';
import { Page } from './api.models';
import { todasLasPaginas } from './todas-las-paginas';

const pagina = (n: number, last: number, items: number[]): Page<number> => ({
  items,
  pagination: { current_page: n, last_page: last, per_page: 2, total: 5 },
});

describe('todasLasPaginas', () => {
  it('junta los items de todas las páginas en orden', async () => {
    const paginas = [pagina(1, 3, [1, 2]), pagina(2, 3, [3, 4]), pagina(3, 3, [5])];
    const listar = vi.fn((n: number) => of(paginas[n - 1]));

    const todos = await new Promise<number[]>((resolve) => todasLasPaginas(listar).subscribe(resolve));

    expect(todos).toEqual([1, 2, 3, 4, 5]);
    expect(listar.mock.calls.map((c) => c[0])).toEqual([1, 2, 3]);
  });

  it('con una sola página hace una sola petición', async () => {
    const listar = vi.fn(() => of(pagina(1, 1, [7, 8])));

    const todos = await new Promise<number[]>((resolve) => todasLasPaginas(listar).subscribe(resolve));

    expect(todos).toEqual([7, 8]);
    expect(listar).toHaveBeenCalledTimes(1);
  });
});
