import { EMPTY, Observable, expand, reduce } from 'rxjs';
import { Page } from './api.models';

/**
 * Junta los items de todas las páginas de un listado (por ejemplo, para llenar un selector).
 * `listar` es el método `list(page)` de un servicio.
 */
export function todasLasPaginas<T>(listar: (pagina: number) => Observable<Page<T>>): Observable<T[]> {
  return listar(1).pipe(
    expand((page) =>
      page.pagination.current_page < page.pagination.last_page ? listar(page.pagination.current_page + 1) : EMPTY,
    ),
    reduce((acumulado, page) => acumulado.concat(page.items), [] as T[]),
  );
}
